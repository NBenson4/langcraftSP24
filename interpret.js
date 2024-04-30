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
        const p_orderCommand = /^order$/; // Regular expression for the "order" keyword to print to console
        const p_singleCommand = /[^\s{}]+(?=\(\{\))/;
        const p_blockOfCode = /\\_\/((.|\n)*?)\\_\//;
        const p_assignmentOperator = /~/;
        const p_unaryOperator = /dirty/;
        const p_number = /^-?\d+(\.\d+)?$/;
        const p_integerVariable = /^-?\d+(\.\d+)?$/;
        const p_stringVariable = /\b\*(.*?)\*\b/;
        const p_booleanVariable = /\bisDecaf\b/;
        const p_multiply = /\bcaffeine\b/;
        const p_divide = /\bfrappe\b/;
        const p_add = /\bsprinkles\b/;
        const p_subtract = /\bice\b/;
        const p_string = /\*(.*?)\*/; // * example *
        const p_identifier = /^[a-zA-Z_][a-zA-Z0-9_]*$/; // Regular expression for identifying identifiers
        const p_sips = /\bsips\b/; // Regular expression for the "sips" operator

        let inMultiLineComment = false;

        for (let line of this.i) {
            if (inMultiLineComment) {
                // If inside a multiline comment, check for the end 
                if (line.includes('$$${')) {
                    inMultiLineComment = false; // End of the multiline comment
                }
                continue; // Skip processing this line
            }

            if (line.startsWith('$$$')) {
                // Start of multiline comment
                inMultiLineComment = true;
                continue; // Skip processing this line
            } else if (line.trim().startsWith('$')) {
                // Skip single-line comments
                continue;
            }

            // Split the line into tokens based on whitespace
            const tokens = line.split(/\s+/);

            for (let token of tokens) {
                // Check for different types of tokens
                const stringMatches = line.match(p_string);
                if (stringMatches) {
                    const stringValue = stringMatches[1];
                    this.out.push({ "Type": Type.STRING, "value": stringValue });
                    line = line.replace(p_string, ''); // Remove string from line
                }
                if (p_singleCommand.test(token)) {
                    this.out.push({ "Type": Type.EOC, "value": token.match(p_singleCommand)[0] });
                } else if (p_blockOfCode.test(token)) {
                    this.out.push({ "Type": Type.BLOCK, "value": token.match(p_blockOfCode)[1] });
                } else if (p_assignmentOperator.test(token)) {
                    this.out.push({ "Type": Type.EQUALS, "value": token });
                } else if (p_unaryOperator.test(token)) {
                    this.out.push({ "Type": Type.OPERATOR, "value": token });
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

    parse() {
        if (!this.tokens.length) {
            return null;  // Early exit if there are no tokens
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

        if (firstToken.Type === Type.STRING) {
            // If the first token is a string, handle it appropriately
            this.nextToken();
            return {
                'Type': 'StringLiteral',
                'value': firstToken.value
            };
        } else if (firstToken.Type !== Type.NUMBER) {
            // If the first token is not a number or string, throw an error
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
        this.stringAccumulator = ''; // Accumulator for string tokens
        this.withLegsFlag = false; // Flag to track if 'withLegs' command is present
    }

    evaluateAST(ast) {
        switch (ast['Type']) {
            case 'Literal':
                // Return the value as is (number or string)
                return ast['value'];
            case 'StringLiteral':
                // Handle string literals
                if (this.withLegsFlag) {
                    // Append '000' to the string if 'withLegs' command is present
                    this.stringAccumulator += '000';
                }
                this.stringAccumulator += ast['value']+= '({)'; // Accumulate string tokens
                return ast['value'];
            case 'BinaryOperation':
                if (ast['operator'] === 'sprinkles') {
                    const leftVal = this.evaluateAST(ast['left']); // Evaluate left operand
                    const rightVal = this.evaluateAST(ast['right']); // Evaluate right operand
                    // Check if both operands are integers, then perform addition
                    if (Number.isInteger(leftVal) && Number.isInteger(rightVal)) {
                        return leftVal + rightVal;
                    } else {
                        throw new Error("Cannot add non-integer values");
                    }
                } else if (ast['operator'] === 'sips') {
                    const leftVal = this.evaluateAST(ast['left']); // Evaluate left operand
                    const rightVal = this.evaluateAST(ast['right']); // Evaluate right operand
                    // Concatenate strings without checking types
                    return leftVal + ' ' + rightVal;
                } else if (ast['operator'] === 'frappe') {
                    if (ast['right'] === 0) {
                        throw new Error("Division by zero"); // Handle division by zero
                    }
                    // If the operator is division, evaluate left and right operands and perform division
                    return this.evaluateAST(ast['left']) / this.evaluateAST(ast['right']);
                } else if (ast['operator'] === 'ice') {
                    // If the operator is subtraction, evaluate left and right operands and perform subtraction
                    return this.evaluateAST(ast['left']) - this.evaluateAST(ast['right']);
                } else if (ast['operator'] === 'caffeine') {
                    // If the operator is multiplication, evaluate left and right operands and perform multiplication
                    return this.evaluateAST(ast['left']) * this.evaluateAST(ast['right']);
                } else {
                    throw new Error(`Unsupported operator: ${ast['operator']}`);
                }
            case 'Assignment':
                // Evaluate the value of the assignment and store it in the variable
                const value = this.evaluateAST(ast['value']);
                // For simplicity, assume the variable is already defined and just return its value
                return value;
            case 'Order': // Handle the "order" command
                console.log(ast['value']); // Print the value of the "order" command
                return null; // Return null since "order" command doesn't have a value
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
}

const lines = input.split('\n');
let inMultiLineComment = false; // Initialize the multiline comment flag
for (let line of lines) {
    // Skip lines inside a multiline comment
    if (inMultiLineComment) {
        // If inside a multiline comment, check for the end 
        if (line.includes('$$${')) {
            inMultiLineComment = false; // End of the multiline comment
        }
        continue; // Skip processing this line
    }

    // Skip lines that start with '$' or '$$$' (comments)
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
    }

    const ast = new Parser(tokens).parse();

    if (debug) {
        console.log("\n--------AST--------");
        console.log(ast);
    }

    const result = new Interpreter().evaluateAST(ast);
    const jsonResult = JSON.stringify(result); // Convert result to JSON string


    if (debug) {
        console.log("\n--------RESULT--------");
        console.log(` The result of your line of code is: ${result}\n`);
    } else {
        console.log(result);
        console.log(jsonResult);
    }
}



const consoleOutputs = ["hi"];


fs.writeFileSync('./output.json', JSON.stringify(consoleOutputs, null, 2), 'utf8');

