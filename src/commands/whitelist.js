const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mojangAPI = require('../utils/mojangAPI');
const whitelistManager = require('../utils/whitelistManager');

const data = new SlashCommandBuilder()
  .setName('등록하기')
  .setDescription('마인크래프트 화이트리스트에 닉네임을 추가합니다.')
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
    // Mojang API에서 플레이어 정보 조회
    const playerProfile = await mojangAPI.getPlayerProfile(nickname);

    // 플레이어가 존재하지 않는 경우
    if (!playerProfile) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000') // 빨강색
        .setTitle('화이트리스트 등록 실패!')
        .setDescription(`\`${nickname}\`은/는 존재하지 않는 닉네임입니다.`);

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // 화이트리스트에 추가
    const result = whitelistManager.addPlayer(playerProfile.uuid, playerProfile.name);

    if (!result.success) {
      if (result.message === 'duplicate') {
        // 중복 등록
        const embed = new EmbedBuilder()
          .setColor('#FF0000') // 빨강색
          .setTitle('화이트리스트 중복 유저!')
          .setDescription(`\`${result.player}\`은/는 이미 화이트리스트에 존재합니다.`);

        await interaction.editReply({ embeds: [embed] });
        return;
      }
    }

    // 등록 성공
    const embed = new EmbedBuilder()
      .setColor('#00FF00') // 초록색
      .setTitle('화이트리스트 등록 완료!')
      .setDescription(`\`${result.player}\`을/를 화이트리스트에 추가했습니다!`);

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('오류 발생!')
      .setDescription('API 요청 중 오류가 발생했습니다.');

    await interaction.editReply({ embeds: [embed] });
  }
}

module.exports = {
  data,
  execute,
};
