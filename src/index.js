import { Client, GatewayIntentBits, Events, Collection, REST, Routes } from "discord.js";
import { config } from "dotenv";
import { commands } from "./commands.js";
import { EventManager } from "./eventManager.js";

config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
client.eventManager = new EventManager();

// Register commands
for (const command of commands) {
  client.commands.set(command.data.name, command);
}

async function deployCommands() {
  try {
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

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
}

// Modify the ClientReady event to deploy commands on startup
client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await deployCommands();
});


// client.once(Events.ClientReady, () => {
//   console.log(`Logged in as ${client.user.tag}`);
// });


 // Convert 24-hour times to 12-hour format
    const format12Hour = (time24) => {
      const [hours, minutes] = time24.split(":");
      const period = hours >= 12 ? "PM" : "AM";
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes} ${period}`;
    };

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId.startsWith("date_")) {
    const [_, eventId, date] = interaction.customId.split("_");
    const event = interaction.client.eventManager.getEvent(eventId);

    if (!event) {
      await interaction.reply({
        content: "Event not found!",
        ephemeral: true,
      });
      return;
    }

    // Generate time slots
    const timeSlots = generateTimeSlots(
      event.startTime,
      event.endTime,
      event.duration
    );

    // Create buttons for time slots (max 5 buttons per row)
    const rows = [];
    let currentRow = [];

    timeSlots.forEach((time) => {
      currentRow.push({
        type: 2,
        style: 2,
        custom_id: `vote_${eventId}_${date}_${time}`,
        label: format12Hour(time),
        emoji: "⏰",
      });

      if (currentRow.length === 5) {
        rows.push({
          type: 1,
          components: currentRow,
        });
        currentRow = [];
      }
    });

    // Add remaining buttons if any
    if (currentRow.length > 0) {
      rows.push({
        type: 1,
        components: currentRow,
      });
    }

    await interaction.reply({
      content: `Select available time slots for ${new Date(
        date
      ).toLocaleDateString("en-US", {
        day: "numeric",
        year: "numeric",
        month: "long",
        weekday: "long",
      })}:`,
      components: rows,
      ephemeral: true,
    });
  }

    if (interaction.customId.startsWith("vote_")) {
      const [_, eventId, date, time] = interaction.customId.split("_");
      const event = interaction.client.eventManager.getEvent(eventId);

      if (!event) {
        await interaction.reply({
          content: "Event not found!",
          ephemeral: true,
        });
        return;
      }

      // Add the vote for this specific date and time
      interaction.client.eventManager.addVotes(eventId, interaction.user.id, [
        `${new Date(date).toLocaleDateString("en-US", {
          day: "numeric",
          year: "numeric",
          month: "long",
          weekday: "long",
        })} - ${format12Hour(time)}`,
      ]);

      await interaction.reply({
        content: `You voted for ${new Date(date).toLocaleDateString("en-US", {
          day: "numeric",
          year: "numeric",
          month: "long",
          weekday: "long",
        })} at ${format12Hour(time)}!`,
        ephemeral: true,
      });
    }


});

// Helper function to generate time slots
function generateTimeSlots(startTime, endTime, intervalMinutes) {
  const slots = [];
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  let currentDate = new Date();
  currentDate.setHours(startHour, startMinute, 0);

  const endDate = new Date();
  endDate.setHours(endHour, endMinute, 0);

  while (currentDate <= endDate) {
    slots.push(
      currentDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    );
    currentDate.setMinutes(currentDate.getMinutes() + intervalMinutes);
  }

  return slots;
}



client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error executing this command!",
      ephemeral: true,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
