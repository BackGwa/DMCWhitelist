const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ 봇 로그인 완료! ${client.user.tag}`);

    // 명령어 데이터 수집
    const commands = [];
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      if ('data' in command) {
        commands.push(command.data.toJSON());
      }
    }

    // Discord API에 명령어 등록
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
      console.log(`⚙️  ${commands.length}개의 슬래시 명령어를 등록하는 중...`);

      const data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );

      console.log(`✅ ${data.length}개의 슬래시 명령어를 등록했습니다!`);
    } catch (error) {
      console.error('❌ 명령어 등록 중 오류:', error);
    }
  },
};
