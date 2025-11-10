const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const whitelistManager = require('../utils/whitelistManager');

const data = new SlashCommandBuilder()
  .setName('해제하기')
  .setDescription('마인크래프트 화이트리스트에서 닉네임을 제거합니다.')
  .addStringOption(option =>
    option
      .setName('닉네임')
      .setDescription('마인크래프트 플레이어 닉네임')
      .setRequired(true)
  );

async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const nickname = interaction.options.getString('닉네임');

  try {
    // 화이트리스트에서 제거
    const result = whitelistManager.removePlayer(nickname);

    if (!result.success) {
      if (result.message === 'not_found') {
        // 등록되지 않은 사용자
        const embed = new EmbedBuilder()
          .setColor('#FF0000') // 빨강색
          .setTitle('화이트리스트 제거 실패!')
          .setDescription(`\`${result.player}\`은/는 화이트리스트에 없습니다.`);

        await interaction.editReply({ embeds: [embed] });
        return;
      }
    }

    // 제거 성공
    const embed = new EmbedBuilder()
      .setColor('#00FF00') // 초록색
      .setTitle('화이트리스트 제거 성공!')
      .setDescription(`\`${result.player}\`을/를 화이트리스트에서 제거했습니다!`);

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('오류 발생!')
      .setDescription('제거 중 오류가 발생했습니다.');

    await interaction.editReply({ embeds: [embed] });
  }
}

module.exports = {
  data,
  execute,
};
