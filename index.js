const { createTokens } = require('./lexer');
const { prompt } = require('enquirer');
const chalk = require('chalk');

(async () => {
  // Repeat forever
  while (true) {
    // Prompt for a command
    const { command } = await prompt({ name: 'command', message: '>>>', type: 'input', prefix: '' });

    // Run the lexer on the command
    const tokens = createTokens(command);

    // Output the tokens
    console.log(`${chalk.gray('<•')} ${tokens.map(t => t.toString()).join('; ')}`);
  }
})();