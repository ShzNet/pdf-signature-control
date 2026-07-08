using System.Collections.Concurrent;
using SignatureControl.Contracts;

namespace SignatureControl.Signing.Api.Services;

public sealed class InMemorySigningSessionStore : ISigningSessionStore
{
    private readonly ConcurrentDictionary<string, SigningSessionState> _sessions = new();

    public Task SaveAsync(SigningSessionState state, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        _sessions[state.SigningSessionId] = state;
        return Task.CompletedTask;
    }

    public Task<SigningSessionState?> GetAsync(string signingSessionId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        _sessions.TryGetValue(signingSessionId, out var state);
        return Task.FromResult(state);
    }

    public Task MarkCompletedAsync(string signingSessionId, string finalDocumentId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (_sessions.TryGetValue(signingSessionId, out var current))
        {
            _sessions[signingSessionId] = current with
            {
                Status = "filled",
                FinalDocumentId = finalDocumentId
            };
        }

        return Task.CompletedTask;
    }
}
