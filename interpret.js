const consoleOutputs = []; // store console outputs for JSON output
const Type1 = { 
    INPUT: "INPUT",
    TOKENS: "TOKENS",
    AST: "AST",
    RESULT: "RESULT"
};

const Type = {
    IDENTIFIER: "IDENTIFIER",
    OPERATOR: "OPERATOR",
    EOC: "ENDOFCOMMAND",
    EQUALS: "EQUALS",
    NUMBER: "NUMBER",
    STRING: "STRING",
    ORDER: "ORDER"
};

class Lexer {
    constructor(input) {
        this.i = input.split(/\n/); // Split input string on newlines
        this.out = []; 
    }

    lex(line) {
        // Patterns to check 
        const p_singleLineComment = /\$.*$/;
        const p_multiLineComment = /\$\$\$(.|\n)*?\$\$\$/;
        const p_orderCommand = /^order$/; 
        const p_singleCommand = /[^\s{}]+(?=\(\{\))/;
        const p_blockOfCode = /\\_\/((.|\n)*?)\\_\//; // supposed to be \_/ but can't because otherwise it would be a comment
        const p_assignmentOperator = /~/;
        const p_number = /^-?\d+(\.\d+)?$/;
        const p_integerVariable = /^-?\d+(\.\d+)?$/;
        const p_stringVariable = /\b\*(.*?)\*\b/;
        const p_booleanVariable = /\bisDecaf\b/;
        const p_multiply = /\bcaffeine\b/;
        const p_divide = /\bfrappe\b/;
        const p_add = /\bsprinkles\b/;
        const p_subtract = /\bice\b/;
        const p_string = /\*(.*?)\*/; // * example *
        const p_identifier = /^[a-zA-Z_][a-zA-Z0-9_]*$/; 
        const p_sips = /\bsips\b/; // to add two strings togetther

        let inMultiLineComment = false; //checks for multiline comments

        for (let line of this.i) {
            if (inMultiLineComment) { //checks if inside a multiline comment
                if (line.includes('$$${')) {
                    inMultiLineComment = false; 
                }
                continue; 
            }
            if (line.startsWith('$$$')) { //checks for start of multiline
                inMultiLineComment = true;
                continue; 
            } else if (line.trim().startsWith('$')) {
                continue; //skips single line comments
            }

            // Split the line into tokens based on whitespace
            const tokens = line.split(/\s+/);

            for (let token of tokens) {
                // Check for different types of tokens
                const stringMatches = line.match(p_string);
                if (stringMatches) {
                    const stringValue = stringMatches[1];
                    this.out.push({ "Type": Type.STRING, "value": stringValue });
                    line = line.replace(p_string, ''); 
                }
                if (p_singleCommand.test(token)) {
                    this.out.push({ "Type": Type.EOC, "value": token.match(p_singleCommand)[0] });
                } else if (p_blockOfCode.test(token)) {
                    this.out.push({ "Type": Type.BLOCK, "value": token.match(p_blockOfCode)[1] });
                } else if (p_assignmentOperator.test(token)) {
                    this.out.push({ "Type": Type.EQUALS, "value": token });
                } else if (p_number.test(token)) {
                    this.out.push({ "Type": Type.NUMBER, "value": parseFloat(token) });
                } else if (p_integerVariable.test(token) || p_stringVariable.test(token) || p_booleanVariable.test(token)) {
                    this.out.push({ "Type": Type.IDENTIFIER, "value": token });
                } else if (p_multiply.test(token) || p_divide.test(token) || p_add.test(token) || p_subtract.test(token) || p_sips.test(token)) {
                    this.out.push({ "Type": Type.OPERATOR, "value": token });
                } else if (p_identifier.test(token)) {
                    this.out.push({ "Type": Type.IDENTIFIER, "value": token });
                } else if (p_orderCommand.test(token)) {
                    this.out.push({ "Type": Type.ORDER, "value": token });
                    continue;
                }
            }

        }

        return this.out;
    }
}

class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.index = 0;
        this.current_token = this.tokens[this.index] || null;
    }

    
    nextToken() {
        this.index++;
        this.current_token = this.tokens[this.index] || null;
    }

    parse() { //parse tokens into AST
        if (!this.tokens.length) {
            return null;  // if there are no tokens, exit
        }

        let left = this.parseExpression();

        // Process as long as there are tokens and the current token is an operator
        while (this.tokens[this.index] && (this.tokens[this.index].Type === Type.OPERATOR || this.tokens[this.index].value === 'sips')) {
            const operator = this.tokens[this.index].value;
            this.nextToken();

            const right = this.parseExpression();

            left = {
                'Type': 'BinaryOperation',
                'operator': operator,
                'left': left,
                'right': right
            };
        }

        return left;
    }

    parseExpression() {
        const firstToken = this.tokens[this.index];

        //checks to see if first token is a number or string
        if (firstToken.Type === Type.STRING) {
            this.nextToken();
            return {
                'Type': 'StringLiteral',
                'value': firstToken.value
            };
        } else if (firstToken.Type !== Type.NUMBER) {
            throw new Error("Syntax Error: Expected a number or string at the beginning of the expression.");
        }

        let left = {
            'Type': 'Literal',
            'value': this.tokens[this.index].value
        };
        this.nextToken();

        return left;
    }
}

class Interpreter {
    constructor() {
        this.variables = {}; // place to store variables
        this.stringAccumulator = ''; // place for strings
        this.withLegsFlag = false; // Flag to track if 'withLegs' command is present
    }

    evaluateAST(ast) {
        switch (ast['Type']) {
            case 'Literal':
                // Return the value as is (number or string)
                return ast['value'];
            case 'StringLiteral':
                if (this.withLegsFlag) {
                    this.stringAccumulator += '({)'; // adds ({) to end of string
                }
                this.stringAccumulator += ast['value']+= '({)'; 
                return ast['value'];
            case 'BinaryOperation':
                if (ast['operator'] === 'sprinkles') {
                    const leftVal = this.evaluateAST(ast['left']); // Evaluate left operand
                    const rightVal = this.evaluateAST(ast['right']); // Evaluate right operand
                    if (Number.isInteger(leftVal) && Number.isInteger(rightVal)) {
                        return leftVal + rightVal;
                    } else {
                        throw new Error("Cannot add non-integer values");
                    }
                } else if (ast['operator'] === 'sips') { //trying to add two strings together, but it only prints the first value in the output
                    const leftVal = this.evaluateAST(ast['left']); // Evaluate left operand
                    const rightVal = this.evaluateAST(ast['right']); // Evaluate right operand
                    return String(leftVal) + ' ' + String(rightVal);
                } else if (ast['operator'] === 'frappe') {
                    if (ast['right'] === 0) {
                        throw new Error("Division by zero"); // Handle division by zero
                }
                    return this.evaluateAST(ast['left']) / this.evaluateAST(ast['right']);
                } else if (ast['operator'] === 'ice') {
                    return this.evaluateAST(ast['left']) - this.evaluateAST(ast['right']);
                } else if (ast['operator'] === 'caffeine') {
                    return this.evaluateAST(ast['left']) * this.evaluateAST(ast['right']);
                } else {
                    throw new Error(`Unsupported operator: ${ast['operator']}`);
                }
            case 'Assignment': //trying to implement variable assignment if it's already assigned
                const value = this.evaluateAST(ast['value']);
                return value;
            case 'Order': 
                console.log(ast['value']); // Print the value of the "order" command
                return null; 
            default:
                throw new Error(`Unsupported node type: ${ast['Type']}`);
        }
    }
}



let debug = true;
let input = "";

const fs = require('fs');

const filePath = process.argv[2];

try {
    // Read the file synchronously
    input = fs.readFileSync(filePath, 'utf8');
} catch (err) {
    console.error(err);
}

if (debug) {
    console.log("\n--------INPUT--------");
    console.log(input);
    consoleOutputs.push({ "section": Type1.INPUT, "content": input }); //pushes to JSON output

}

const lines = input.split('\n');

//skip interpreting comments
let inMultiLineComment = false; 
for (let line of lines) {
    if (inMultiLineComment) {
        if (line.includes('$$${')) {
            inMultiLineComment = false; 
        }
        continue; 
    }
    if (line.trim().startsWith('$')) {
        if (line.trim().startsWith('$$$')) {
            inMultiLineComment = true; // Start of a multiline comment
        }
        continue;
    }

    const tokens = new Lexer(line).lex();

    if (debug) {
        console.log("\n--------TOKENS--------");
        console.log("");
        for (let t of tokens) {
            console.log(t);
            
        }
        console.log("");
        consoleOutputs.push({ "section": Type1.TOKENS, "content": tokens }); //pushes to JSON output

    }

    const ast = new Parser(tokens).parse();

    if (debug) {
        console.log("\n--------AST--------");
        console.log(ast);
        consoleOutputs.push({ "section": Type1.AST, "content": ast }); //pushes to JSON output

    }

    const result = new Interpreter().evaluateAST(ast);
    
    const jsonResult = JSON.stringify(result); // Convert result to JSON string


    if (debug) {
        console.log("\n--------RESULT--------");
        console.log(` The result of your line of code is: ${result}\n`);
        consoleOutputs.push({ "section": Type1.RESULT, "content": result }); //pushes to JSON output

    } else {
        console.log(result);
        console.log(jsonResult);
    }
}

fs.writeFileSync('./output.json', JSON.stringify(consoleOutputs, null, 2), 'utf8'); //writes the JSON file

