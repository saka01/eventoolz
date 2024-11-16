import { REST, Routes } from "discord.js";
import { config } from "dotenv";
import { commands } from "./commands.js";

config();

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

try {
  console.log("Started refreshing application (/) commands.");

  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands.map((command) => command.data.toJSON()) }
  );

  console.log("Successfully reloaded application (/) commands.");
} catch (error) {
  console.error(error);
}
