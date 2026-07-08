using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using iText.Bouncycastleconnector;
using iText.Commons.Bouncycastle.Cert;
using iText.Kernel.Pdf;
using iText.Signatures;
using iText.Signatures.Cms;
using SignatureControl.Contracts;

namespace SignatureControl.Signing.Api.Services;

public sealed class ITextPdfTwoPhaseSignService : IPdfTwoPhaseSignService
{
    private const int EstimatedSignatureSize = 12000;
    private readonly FakeCertificateProvider _fakeCertificateProvider;

    public ITextPdfTwoPhaseSignService(FakeCertificateProvider fakeCertificateProvider)
    {
        _fakeCertificateProvider = fakeCertificateProvider;
    }

    public Task<PrepareSignResult> PrepareSignFileAsync(
        byte[] pdfContentAlreadyStamped,
        string fieldName,
        List<byte[]> certificateChains,
        HashAlgorithmType hashAlgorithm,
        DateTimeOffset signTime,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        var signingMaterial = ResolveSigningMaterial(certificateChains);
        using var input = new MemoryStream(pdfContentAlreadyStamped);
        using var output = new MemoryStream();
        using var reader = new PdfReader(input);

        var signerProperties = new SignerProperties()
            .SetFieldName(fieldName)
            .SetClaimedSignDate(signTime.UtcDateTime);

        var signer = new PdfTwoPhaseSigner(reader, output)
            .SetStampingProperties(new StampingProperties().UseAppendMode());

        var documentDigest = signer.PrepareDocumentForSignature(
            signerProperties,
            GetDigestAlgorithmName(hashAlgorithm),
            PdfName.Adobe_PPKLite,
            PdfName.Adbe_pkcs7_detached,
            EstimatedSignatureSize,
            includeDate: true);

        var cmsContainer = BuildCmsContainer(signingMaterial.Certificates, signingMaterial.SigningCertificate, hashAlgorithm, documentDigest);
        var signedAttributes = cmsContainer.GetSerializedSignedAttributes();
        var serializedCmsContainer = cmsContainer.Serialize();

        return Task.FromResult(new PrepareSignResult(
            $"prepared_{Guid.NewGuid():N}",
            output.ToArray(),
            signedAttributes,
            serializedCmsContainer,
            signingMaterial.SignatureAlgorithm));
    }

    public Task<SignResult> FillSignFileAsync(
        byte[] preparedPdfContent,
        string fieldName,
        byte[] serializedCmsContainer,
        string signatureAlgorithm,
        HashAlgorithmType hashAlgorithm,
        byte[] signature,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        var effectiveSignature = signature.Length > 0
            ? signature
            : _fakeCertificateProvider.Sign(new CMSContainer(serializedCmsContainer).GetSerializedSignedAttributes(), hashAlgorithm);

        var cmsContainer = new CMSContainer(serializedCmsContainer);
        var signerInfo = cmsContainer.GetSignerInfo();
        signerInfo.SetSignatureAlgorithm(new AlgorithmIdentifier(GetSignatureMechanismOid(signatureAlgorithm, hashAlgorithm)));
        signerInfo.SetSignature(effectiveSignature);

        using var output = new MemoryStream();
        using var input = new MemoryStream(preparedPdfContent);
        using var reader = new PdfReader(input);

        PdfTwoPhaseSigner.AddSignatureToPreparedDocument(reader, fieldName, output, cmsContainer);

        var finalBytes = output.ToArray();
        return Task.FromResult(new SignResult(
            $"signed_{Convert.ToHexString(SHA256.HashData(finalBytes)).ToLowerInvariant()[..16]}",
            finalBytes));
    }

    private static CMSContainer BuildCmsContainer(
        IReadOnlyList<IX509Certificate> chain,
        IX509Certificate signingCertificate,
        HashAlgorithmType hashAlgorithm,
        byte[] documentDigest)
    {
        var digestAlgorithmOid = GetDigestAlgorithmOid(hashAlgorithm);
        var signerInfo = new SignerInfo();
        signerInfo.SetSigningCertificateAndAddToSignedAttributes(signingCertificate, digestAlgorithmOid);
        signerInfo.SetDigestAlgorithm(new AlgorithmIdentifier(digestAlgorithmOid));
        signerInfo.SetMessageDigest(documentDigest);

        var cmsContainer = new CMSContainer();
        cmsContainer.AddCertificates(chain.ToArray());
        cmsContainer.SetSignerInfo(signerInfo);
        return cmsContainer;
    }

    private ResolvedSigningMaterial ResolveSigningMaterial(IReadOnlyList<byte[]> certificateChains)
    {
        if (certificateChains.Count == 0)
        {
            var fakeCertBytes = _fakeCertificateProvider.ExportCertificateBytes();
            var fakeX509 = X509CertificateLoader.LoadCertificate(fakeCertBytes);
            return new ResolvedSigningMaterial(
                [ParseCertificate(fakeCertBytes)],
                ParseCertificate(fakeCertBytes),
                GetSignatureAlgorithm(fakeX509));
        }

        var normalized = certificateChains.Select(NormalizeCertificateBytes).ToArray();
        var chain = normalized.Select(ParseCertificate).ToArray();
        var signingCert = X509CertificateLoader.LoadCertificate(normalized[0]);

        return new ResolvedSigningMaterial(
            chain,
            chain[0],
            GetSignatureAlgorithm(signingCert));
    }

    private static IX509Certificate ParseCertificate(byte[] certificateBytes)
    {
        using var stream = new MemoryStream(certificateBytes, writable: false);
        return BouncyCastleFactoryCreator.GetFactory().CreateX509Certificate(stream);
    }

    private static byte[] NormalizeCertificateBytes(byte[] certificateBytes)
    {
        var text = System.Text.Encoding.UTF8.GetString(certificateBytes);
        if (!text.Contains("BEGIN CERTIFICATE", StringComparison.Ordinal))
        {
            return certificateBytes;
        }

        var base64 = string.Concat(
            text.Split('\n', '\r', StringSplitOptions.RemoveEmptyEntries)
                .Where(line => !line.StartsWith("-----", StringComparison.Ordinal)));

        return Convert.FromBase64String(base64);
    }

    private static string GetDigestAlgorithmName(HashAlgorithmType hashAlgorithm)
    {
        return hashAlgorithm switch
        {
            HashAlgorithmType.Sha384 => "SHA-384",
            HashAlgorithmType.Sha512 => "SHA-512",
            _ => "SHA-256"
        };
    }

    private static string GetDigestAlgorithmOid(HashAlgorithmType hashAlgorithm)
    {
        return hashAlgorithm switch
        {
            HashAlgorithmType.Sha384 => "2.16.840.1.101.3.4.2.2",
            HashAlgorithmType.Sha512 => "2.16.840.1.101.3.4.2.3",
            _ => "2.16.840.1.101.3.4.2.1"
        };
    }

    private static string GetSignatureAlgorithm(X509Certificate2 certificate)
    {
        return certificate.PublicKey.Oid?.Value switch
        {
            "1.2.840.113549.1.1.1" => "RSA",
            "1.2.840.10045.2.1" => "ECDSA",
            _ => throw new NotSupportedException($"Unsupported signing key algorithm '{certificate.PublicKey.Oid?.Value}'.")
        };
    }

    private static string GetSignatureMechanismOid(string signatureAlgorithm, HashAlgorithmType hashAlgorithm)
    {
        return (signatureAlgorithm, hashAlgorithm) switch
        {
            ("RSA", HashAlgorithmType.Sha384) => "1.2.840.113549.1.1.12",
            ("RSA", HashAlgorithmType.Sha512) => "1.2.840.113549.1.1.13",
            ("RSA", _) => "1.2.840.113549.1.1.11",
            ("ECDSA", HashAlgorithmType.Sha384) => "1.2.840.10045.4.3.3",
            ("ECDSA", HashAlgorithmType.Sha512) => "1.2.840.10045.4.3.4",
            ("ECDSA", _) => "1.2.840.10045.4.3.2",
            _ => throw new NotSupportedException($"Unsupported signature algorithm '{signatureAlgorithm}'.")
        };
    }

    private sealed record ResolvedSigningMaterial(
        IReadOnlyList<IX509Certificate> Certificates,
        IX509Certificate SigningCertificate,
        string SignatureAlgorithm);
}
