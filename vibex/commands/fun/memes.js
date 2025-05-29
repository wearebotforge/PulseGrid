import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

export const data = new SlashCommandBuilder()
  .setName('memes')
  .setDescription('Get a meme!')
  .addStringOption(option =>
    option.setName('meme')
      .setDescription('Name of the meme or "random"')
      .setRequired(true)
      .addChoices(
        { name: 'random', value: 'random' },
        // You can add other common meme names here as choices for autocomplete
      )
  );

export async function execute(interaction) {
  const memeName = interaction.options.getString('meme').toLowerCase();

  const memesDir = path.join(__dirname, '..', 'memes');
  let memeFiles = fs.readdirSync(memesDir).filter(file => file.endsWith('.js'));

  if (memeName === 'random') {
    // Pick random meme
    const randomFile = memeFiles[Math.floor(Math.random() * memeFiles.length)];
    const memeModule = await import(path.join(memesDir, randomFile));
    return memeModule.execute(interaction);
  } else {
    // Try to find specific meme file
    const memeFile = memeFiles.find(file => file.toLowerCase() === `${memeName}.js`);
    if (!memeFile) {
      return interaction.reply({ content: `Meme "${memeName}" not found!`, ephemeral: true });
    }
    const memeModule = await import(path.join(memesDir, memeFile));
    return memeModule.execute(interaction);
  }
}
