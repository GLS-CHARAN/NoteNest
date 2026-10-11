using NoteNest.Api.Services;
using Xunit;

namespace NoteNest.Tests;

public class PasswordHasherTests
{
    [Fact]
    public void Correct_password_verifies_and_wrong_one_does_not()
    {
        var hash = PasswordHasher.Hash("Secret123");
        Assert.True(PasswordHasher.Verify(hash, "Secret123"));
        Assert.False(PasswordHasher.Verify(hash, "secret123"));
    }

    [Fact]
    public void Same_password_gives_different_hashes()
    {
        Assert.NotEqual(PasswordHasher.Hash("Secret123"), PasswordHasher.Hash("Secret123"));
    }

    [Fact]
    public void Hash_does_not_contain_the_password() =>
        Assert.DoesNotContain("Secret123", PasswordHasher.Hash("Secret123"));

    [Theory]
    [InlineData("short1A", false)]
    [InlineData("alllowercase1", false)]
    [InlineData("ALLUPPERCASE1", false)]
    [InlineData("NoDigitsHere", false)]
    [InlineData("Good1234", true)]
    public void Enforces_password_rules(string pw, bool ok) =>
        Assert.Equal(ok, PasswordHasher.Problem(pw) is null);
}
