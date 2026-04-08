using Project.Application.Common.Results;

namespace Project.Tests;

public class ResultTests
{
    [Fact]
    public void Success_CreatesSucceededResult()
    {
        var result = Result.Success();

        Assert.True(result.Succeeded);
        Assert.Null(result.Error);
    }
}
