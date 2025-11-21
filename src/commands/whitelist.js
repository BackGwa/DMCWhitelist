const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const mojangAPI = require('../utils/mojangAPI');
const whitelistManager = require('../utils/whitelistManager');
const broadcastManager = require('../utils/broadcastManager');

const data = new SlashCommandBuilder()
  .setName('등록하기')
  .setDescription('마인크래프트 화이트리스트에 닉네임을 추가합니다.')
  .addStringOption(option =>
    option
      .setName('마크_닉네임')
      .setDescription('마인크래프트 플레이어 닉네임')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('방송국_이름')
      .setDescription('방송국 이름')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('방송국_아이디')
      .setDescription('SOOP 방송 플랫폼 아이디 (링크 주소 X)')
      .setRequired(true)
  );

async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const mcNickname = interaction.options.getString('마크_닉네임');
  const broadcastName = interaction.options.getString('방송국_이름');
  const broadcastId = interaction.options.getString('방송국_아이디');

  try {
    // 방송국 아이디 검증
    const validation = broadcastManager.validateBroadcastId(broadcastId);
    if (!validation.valid) {
      let errorMessage = '';
      if (validation.error === 'space') {
        errorMessage = '방송국 아이디에는 띄어쓰기를 포함할 수 없습니다.';
      } else if (validation.error === 'link') {
        errorMessage = '링크 주소가 아닌 방송국 아이디만 입력해주세요.\n예시: `afreecatv123` (O) / `https://afreecatv.com/afreecatv123` (X)';
      }

      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('입력 오류!')
        .setDescription(errorMessage);

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Mojang API에서 플레이어 정보 조회
    const playerProfile = await mojangAPI.getPlayerProfile(mcNickname);

    // 플레이어가 존재하지 않는 경우
    if (!playerProfile) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('화이트리스트 등록 실패!')
        .setDescription(`\`${mcNickname}\`은/는 존재하지 않는 닉네임입니다.`);

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // 확인 메시지와 버튼 생성
    const confirmEmbed = new EmbedBuilder()
      .setColor('#FFFF00') // 노란색
      .setTitle('등록 정보 확인')
      .setDescription('아래 정보가 맞는지 확인해주세요.')
      .addFields(
        { name: '마인크래프트 닉네임', value: `\`${playerProfile.name}\``, inline: true },
        { name: '방송국 이름', value: `\`${broadcastName}\``, inline: true },
        { name: '방송국 아이디', value: `\`${broadcastId}\``, inline: true }
      )
      .setFooter({ text: '아래 버튼을 눌러 등록을 완료하세요.' });

    const confirmButton = new ButtonBuilder()
      .setCustomId('confirm_register')
      .setLabel('네, 맞습니다')
      .setStyle(ButtonStyle.Success);

    const cancelButton = new ButtonBuilder()
      .setCustomId('cancel_register')
      .setLabel('취소')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder()
      .addComponents(confirmButton, cancelButton);

    const response = await interaction.editReply({
      embeds: [confirmEmbed],
      components: [row],
    });

    // 버튼 클릭 대기 (60초)
    const collectorFilter = i => i.user.id === interaction.user.id;
    try {
      const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60000 });

      if (confirmation.customId === 'confirm_register') {
        // 등록 진행
        await confirmation.deferUpdate();

        // 화이트리스트 중복 확인
        const whitelistResult = whitelistManager.addPlayer(playerProfile.uuid, playerProfile.name);
        if (!whitelistResult.success && whitelistResult.message === 'duplicate') {
          const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('화이트리스트 중복 유저!')
            .setDescription(`\`${whitelistResult.player}\`은/는 이미 화이트리스트에 존재합니다.`);

          await interaction.editReply({ embeds: [embed], components: [] });
          return;
        }

        // 방송국 추가
        const broadcastResult = broadcastManager.addBroadcast(broadcastName, playerProfile.name, broadcastId);
        if (!broadcastResult.success && broadcastResult.message === 'duplicate') {
          // 이미 화이트리스트에는 추가되었으므로, 방송국 정보만 중복
          const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('방송국 중복 등록!')
            .setDescription(`\`${broadcastResult.nickname}\`은/는 이미 방송국 정보에 존재합니다.`);

          await interaction.editReply({ embeds: [embed], components: [] });
          return;
        }

        // 등록 성공
        const successEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('화이트리스트 등록 완료!')
          .setDescription(`\`${playerProfile.name}\`을/를 화이트리스트에 추가했습니다!`)
          .addFields(
            { name: '방송국 이름', value: `\`${broadcastName}\``, inline: true },
            { name: '방송국 아이디', value: `\`${broadcastId}\``, inline: true }
          );

        await interaction.editReply({ embeds: [successEmbed], components: [] });

      } else if (confirmation.customId === 'cancel_register') {
        // 취소
        await confirmation.deferUpdate();

        const cancelEmbed = new EmbedBuilder()
          .setColor('#808080') // 회색
          .setTitle('등록 취소')
          .setDescription('화이트리스트 등록이 취소되었습니다.');

        await interaction.editReply({ embeds: [cancelEmbed], components: [] });
      }

    } catch (e) {
      // 시간 초과
      const timeoutEmbed = new EmbedBuilder()
        .setColor('#808080')
        .setTitle('시간 초과')
        .setDescription('응답 시간이 초과되어 등록이 취소되었습니다.');

      await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
    }

  } catch (error) {
    console.error(error);
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('오류 발생!')
      .setDescription('API 요청 중 오류가 발생했습니다.');

    await interaction.editReply({ embeds: [embed], components: [] });
  }
}

module.exports = {
  data,
  execute,
};
