using NoteNest.Api.Data;
using NoteNest.Api.Models;
using Xunit;

namespace NoteNest.Tests;

public class JsonDbTests : IDisposable
{
    private readonly string _dir = Path.Combine(Path.GetTempPath(), "notenest-test-" + Guid.NewGuid().ToString("N"));
    private string DbFile => Path.Combine(_dir, "json.db");
    public void Dispose() { if (Directory.Exists(_dir)) Directory.Delete(_dir, true); }

    [Fact]
    public void Creates_the_file_on_first_start()
    {
        _ = new JsonDb(DbFile);
        Assert.True(File.Exists(DbFile));
    }

    [Fact]
    public void Data_survives_a_restart()
    {
        var db = new JsonDb(DbFile);
        db.Write(d => { d.Notes.Add(new Note { Id = d.NextNoteId++, OwnerId = "u1", Title = "Persist me" }); return 0; });

        var reopened = new JsonDb(DbFile);   // simulates restarting the API
        var title = reopened.Read(d => d.Notes.Single().Title);
        Assert.Equal("Persist me", title);
    }

    [Fact]
    public void Failed_write_does_not_change_data()
    {
        var db = new JsonDb(DbFile);
        db.Write(d => { d.Notes.Add(new Note { Id = 1, OwnerId = "u1", Title = "Keep" }); return 0; });

        Assert.Throws<InvalidOperationException>(() => db.Write<int>(d =>
        {
            d.Notes.Clear();
            throw new InvalidOperationException("boom");
        }));

        Assert.Equal(1, db.Read(d => d.Notes.Count));   // rolled back from disk
    }

    [Fact]
    public void Writes_enums_as_text()
    {
        var db = new JsonDb(DbFile);
        db.Write(d => { d.NoteShares.Add(new NoteShare { Id = 1, NoteId = 1, SharedWithUserId = "x", Permission = SharePermission.Editor }); return 0; });
        Assert.Contains("\"Editor\"", File.ReadAllText(DbFile));
    }
}
