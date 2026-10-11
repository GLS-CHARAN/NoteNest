using NoteNest.Api.Data;
using NoteNest.Api.Models;
using NoteNest.Api.Services;
using Xunit;

namespace NoteNest.Tests;

public class NoteAccessTests
{
    private static DbData Arrange()
    {
        var d = new DbData();
        d.Notes.Add(new Note { Id = 1, OwnerId = "owner", Title = "Secret" });
        d.NoteShares.Add(new NoteShare { Id = 1, NoteId = 1, SharedWithUserId = "viewer", Permission = SharePermission.Viewer });
        d.NoteShares.Add(new NoteShare { Id = 2, NoteId = 1, SharedWithUserId = "editor", Permission = SharePermission.Editor });
        return d;
    }

    [Theory]
    [InlineData("owner", NoteRole.Owner)]
    [InlineData("editor", NoteRole.Editor)]
    [InlineData("viewer", NoteRole.Viewer)]
    [InlineData("stranger", NoteRole.None)]
    public void Resolves_role_for_each_user(string user, NoteRole expected) =>
        Assert.Equal(expected, NoteAccess.GetRole(Arrange(), 1, user));

    [Fact]
    public void Missing_note_gives_no_access() =>
        Assert.Equal(NoteRole.None, NoteAccess.GetRole(Arrange(), 999, "owner"));

    [Fact]
    public void Revoking_a_share_removes_access()
    {
        var d = Arrange();
        d.NoteShares.RemoveAll(s => s.SharedWithUserId == "viewer");
        Assert.Equal(NoteRole.None, NoteAccess.GetRole(d, 1, "viewer"));
    }
}
