using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using SignatureControl.Contracts;

namespace SignatureControl.Signing.Api.Services;

public sealed class FakeCertificateProvider
{
    private readonly RSA _privateKey;

    public FakeCertificateProvider()
    {
        var certPath = FindAssetPath("fake-signer-cert.pem");
        var keyPath = FindAssetPath("fake-signer-key.pem");

        Certificate = X509CertificateLoader.LoadCertificateFromFile(certPath);
        _privateKey = RSA.Create();
        _privateKey.ImportFromPem(File.ReadAllText(keyPath));
    }

    public X509Certificate2 Certificate { get; }

    public byte[] ExportCertificateBytes()
    {
        return Certificate.Export(X509ContentType.Cert);
    }

    public byte[] Sign(byte[] data, HashAlgorithmType hashAlgorithm)
    {
        var hashName = hashAlgorithm switch
        {
            HashAlgorithmType.Sha384 => HashAlgorithmName.SHA384,
            HashAlgorithmType.Sha512 => HashAlgorithmName.SHA512,
            _ => HashAlgorithmName.SHA256
        };

        return _privateKey.SignData(data, hashName, RSASignaturePadding.Pkcs1);
    }

    private static string FindAssetPath(string fileName)
    {
        var current = new DirectoryInfo(AppContext.BaseDirectory);
        while (current is not null)
        {
            var candidate = Path.Combine(current.FullName, "assets", "certs", fileName);
            if (File.Exists(candidate))
            {
                return candidate;
            }

            current = current.Parent;
        }

        throw new FileNotFoundException($"Could not locate fake signer asset '{fileName}' from '{AppContext.BaseDirectory}'.");
    }
}
