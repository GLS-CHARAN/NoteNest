namespace NoteNest.Api.Services;

/// Replaceable storage abstraction. Swap LocalMediaStorage for a cloud version later.
public interface IMediaStorage
{
    Task SaveAsync(string key, Stream content, CancellationToken ct = default);
    Stream OpenRead(string key);
    Task DeleteAsync(string key);
    bool Exists(string key);
}

public class LocalMediaStorage : IMediaStorage
{
    private readonly string _root;

    public LocalMediaStorage(IConfiguration config, IWebHostEnvironment env)
    {
        var configured = config["MediaStorage:RootPath"] ?? "media-files";
        var path = Path.IsPathRooted(configured) ? configured : Path.Combine(env.ContentRootPath, configured);
        _root = Path.GetFullPath(path);
        Directory.CreateDirectory(_root);
    }

    // Blocks path traversal: the final path must stay inside the root folder.
    private string Resolve(string key)
    {
        var full = Path.GetFullPath(Path.Combine(_root, key));
        if (!full.StartsWith(_root + Path.DirectorySeparatorChar, StringComparison.Ordinal))
            throw new InvalidOperationException("Invalid storage key.");
        return full;
    }

    public async Task SaveAsync(string key, Stream content, CancellationToken ct = default)
    {
        var path = Resolve(key);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        await using var fs = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None);
        await content.CopyToAsync(fs, ct);
    }

    public Stream OpenRead(string key) => new FileStream(Resolve(key), FileMode.Open, FileAccess.Read, FileShare.Read);

    public Task DeleteAsync(string key)
    {
        var path = Resolve(key);
        if (File.Exists(path)) File.Delete(path);
        return Task.CompletedTask;
    }

    public bool Exists(string key) => File.Exists(Resolve(key));
}
