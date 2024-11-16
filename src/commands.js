import { SlashCommandBuilder } from "discord.js";

export const commands = [
  {
    data: new SlashCommandBuilder()
      .setName("create-event")
      .setDescription("Create a new event")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("The name of the event")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("description")
          .setDescription("Description of the event")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("dates")
          .setDescription("Possible dates (comma-separated, YYYY-MM-DD format)")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("start-time")
          .setDescription("Start time (24-hour format, e.g., 09:00)")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("end-time")
          .setDescription("End time (24-hour format, e.g., 17:00)")
          .setRequired(true)
      )
      .addIntegerOption((option) =>
        option
          .setName("duration")
          .setDescription("Time slot duration in minutes")
          .setRequired(true)
          .addChoices(
            { name: "15 minutes", value: 15 },
            { name: "30 minutes", value: 30 },
            { name: "60 minutes", value: 60 },
            { name: "120 minutes", value: 120 }
          )
      )
      .addStringOption((option) =>
        option
          .setName("expires")
          .setDescription("When voting expires (e.g., 24h, 7d)")
          .setRequired(true)
          .addChoices(
            { name: "24 hours", value: "24h" },
            { name: "48 hours", value: "48h" },
            { name: "7 days", value: "7d" },
            { name: "14 days", value: "14d" }
          )
      ),
    async execute(interaction) {
      // Example with multiple allowed roles
      //   const allowedRoles = ["Event Manager", "Moderator", "Event Planner"];
      //   const hasPermission =
      //     interaction.member.permissions.has("Administrator") ||
      //     interaction.member.roles.cache.some((role) =>
      //       allowedRoles.includes(role.name)
      //     );
      //     const hasPermission =
      //       interaction.member.permissions.has("Administrator") ||
      //       interaction.member.roles.cache.some(
      //         (role) => role.name === "Event Manager"
      //       );

      //     if (!hasPermission) {
      //       await interaction.reply({
      //         content:
      //           "You don't have permission to create events. Please contact an administrator.",
      //         ephemeral: true,
      //       });
      //     return;
      //   }

      const name = interaction.options.getString("name");
      const description = interaction.options.getString("description");
      const dates = interaction.options
        .getString("dates")
        .split(",")
        .map((date) => date.trim());
      const startTime = interaction.options.getString("start-time");
      const endTime = interaction.options.getString("end-time");
      const duration = interaction.options.getInteger("duration");
      const expires = interaction.options.getString("expires");

      // Calculate expiration date
      const expiresAt = new Date();
      if (expires.endsWith("h")) {
        expiresAt.setHours(expiresAt.getHours() + parseInt(expires));
      } else if (expires.endsWith("d")) {
        expiresAt.setDate(expiresAt.getDate() + parseInt(expires));
      }

      //   const transformedDate = new Date(dates[0]);

      const event = interaction.client.eventManager.createEvent(
        name,
        description,
        dates,
        interaction.user.id,
        startTime,
        endTime,
        duration,
        expiresAt
      );

      // Create date selection buttons
      const rows = dates.map((date) => ({
        type: 1,
        components: [
          {
            type: 2,
            style: 2,
            custom_id: `date_${event.id}_${date}`,
            label: `${new Date(date).toLocaleDateString("en-US", {
              day: "numeric",
              year: "numeric",
              month: "long",
              weekday: "long",
            })}`,
            emoji: "📅",
          },
        ],
      }));

      const response = {
        embeds: [
          {
            title: `${name}`,
            description: description,
            color: 0x00ff00,
            timestamp: new Date().toISOString(),
            fields: [
              {
                name: "",
                value: `**Voting Expires:** <t:${Math.floor(
                  expiresAt.getTime() / 1000
                )}:R> `,
              },
            ],
            footer: {
              text: `Created by ${interaction.user.username}`,
            },
          },
        ],
        components: rows,
      };

      await interaction.reply(response);

      await interaction.followUp({
        content: `Use this id to get results later. \n \n Event ID: ${event.id}`,
        ephemeral: true,
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("show-results")
      .setDescription("Show voting results for an event")
      .addStringOption((option) =>
        option
          .setName("event-id")
          .setDescription("The ID of the event")
          .setRequired(true)
      ),

    async execute(interaction) {
      const eventId = interaction.options.getString("event-id");
      const results = interaction.client.eventManager.getEventResults(eventId);

      if (!results) {
        await interaction.reply({
          content: "Event not found!",
          ephemeral: true,
        });
        return;
      }

      // Create embed fields for results
      const fields = results.results.map((result, index) => ({
        name: `#${index + 1}: ${result.dateTime}`,
        value: `Votes: ${result.votes}\nVoters: ${result.voters
          .map((id) => `<@${id}>`)
          .join(", ")}`,
      }));

      const embed = {
        title: `📊 Results for: ${results.eventName}`,
        description: `Total number of voters: ${results.totalVoters}`,
        fields: fields,
        color: 0x00ff00, // Green color
        timestamp: new Date().toISOString(),
      };

      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("delete-event")
      .setDescription("Delete an event")
      .addStringOption((option) =>
        option
          .setName("event-id")
          .setDescription("The ID of the event")
          .setRequired(true)
      ),
    async execute(interaction) {
      const eventId = interaction.options.getString("event-id");
      interaction.client.eventManager.deleteEvent(eventId);
      await interaction.reply({ content: "Event deleted!", ephemeral: true });
    },
  },
];
