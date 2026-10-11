using System.Text.Json;
using System.Text.Json.Serialization;
using NoteNest.Api.Models;

namespace NoteNest.Api.Data;

/// Everything that ends up inside json.db.
public class DbData
{
    public int NextNoteId { get; set; } = 1;
    public int NextAttachmentId { get; set; } = 1;
    public int NextCategoryId { get; set; } = 1;
    public int NextTagId { get; set; } = 1;
    public int NextShareId { get; set; } = 1;

    public List<User> Users { get; set; } = new();
    public List<Note> Notes { get; set; } = new();
    public List<NoteAttachment> Attachments { get; set; } = new();
    public List<Category> Categories { get; set; } = new();
    public List<Tag> Tags { get; set; } = new();
    public List<NoteTag> NoteTags { get; set; } = new();
    public List<NoteShare> NoteShares { get; set; } = new();
}

/// A tiny file-based database. The whole dataset lives in memory and is written to one JSON file
/// after every change. One lock makes reads and writes safe. Good for learning and personal use;
/// it is meant for a single running API instance.
public class JsonDb
{
    private static readonly JsonSerializerOptions Options = new()
    {
        WriteIndented = true,
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly string _path;
    private readonly object _lock = new();
    private DbData _data;

    public string FilePath => _path;

    public JsonDb(string path)
    {
        _path = Path.GetFullPath(path);
        Directory.CreateDirectory(Path.GetDirectoryName(_path)!);
        _data = Load();
        if (!File.Exists(_path)) Save();
    }

    private DbData Load()
    {
        if (!File.Exists(_path)) return new DbData();
        var json = File.ReadAllText(_path);
        if (string.IsNullOrWhiteSpace(json)) return new DbData();
        return JsonSerializer.Deserialize<DbData>(json, Options) ?? new DbData();
    }

    // Write to a temp file first, then swap it in, so a crash can never leave a half-written json.db.
    // The previous version is kept as json.db.bak.
    private void Save()
    {
        var tmp = _path + ".tmp";
        File.WriteAllText(tmp, JsonSerializer.Serialize(_data, Options));
        if (File.Exists(_path)) File.Replace(tmp, _path, _path + ".bak");
        else File.Move(tmp, _path);
    }

    /// Read-only access. Build and return DTOs inside the lambda; do not keep entity objects.
    public T Read<T>(Func<DbData, T> query)
    {
        lock (_lock) return query(_data);
    }

    /// Change data, then save the file. If the lambda throws, memory is reloaded from disk.
    public T Write<T>(Func<DbData, T> change)
    {
        lock (_lock)
        {
            try
            {
                var result = change(_data);
                Save();
                return result;
            }
            catch
            {
                _data = Load();
                throw;
            }
        }
    }
}
