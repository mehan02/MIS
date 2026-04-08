using Project.API.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.Sqlite;
using Project.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Host.AddSerilogLogging();
builder.Services.AddApiServices(builder.Configuration);

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
	var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
	if (app.Environment.IsDevelopment())
	{
		try
		{
			dbContext.Database.EnsureCreated();
		}
		catch (SqliteException ex) when (ex.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase))
		{
			// Multiple local API instances can race on first-run table creation; safe to ignore.
		}
	}
	else
	{
		dbContext.Database.Migrate();
	}
}

app.UseApiPipeline();
app.MapApiEndpoints();

app.Run();

public partial class Program;
