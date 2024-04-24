const Type = {
    IDENTIFIER: "IDENTIFIER",
    OPERATOR: "OPERATOR",
    EOC: "ENDOFCOMMAND",
    EQUALS: "EQUALS",
    NUMBER: "NUMBER"
    
};




class Lexer {
    constructor(input) {
        this.i = input.split(/\n/); // Split input string on newlines
        this.out = [];
    }

    lex() {
        // Patterns to check 
        const p_singleLineComment = /\$.*$/;
        const p_multiLineComment = /\$\$\$(.|\n)*?\$\$\$/;
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
        const p_identifier = /^[a-zA-Z_][a-zA-Z0-9_]*$/; // Regular expression for identifying identifiers


        let inMultiLineComment = false;

        for (let line of this.i) {
            if (inMultiLineComment) {
                // If inside a multiline comment, check for the end 
                if (line.includes('$$${')) {
                    inMultiLineComment = false; // End of the multiline comment
                }
                continue; // Skip processing this line
            }
    
            if (line.trim().startsWith('$')) {
                // Skip single-line comments
                continue;
            } else if (line.startsWith('$$${')) {
                // Start of multiline comment
                inMultiLineComment = true;
                continue; // Skip processing this line
            }
    

            // Split the line into tokens based on whitespace
            const tokens = line.split(/\s+/);

            for (let token of tokens) {
                // Check for different types of tokens
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
                } else if (p_multiply.test(token) || p_divide.test(token) || p_add.test(token) || p_subtract.test(token)) {
                    this.out.push({ "Type": Type.OPERATOR, "value": token });
                } else if (p_identifier.test(token)) {
                    this.out.push({ "Type": Type.IDENTIFIER, "value": token });
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
    }

    nextToken() {
        this.index++;
    }

    parse() {
        if (!this.tokens.length) {
            return null;  // Early exit if there are no tokens
        }

        // Start with the first number literal
        if (this.tokens[this.index].Type !== Type.NUMBER) {
            throw new Error("Syntax Error: Expected a number at the beginning of the expression.");
        }
        let left = {
            'Type': 'Literal',
            'value': this.tokens[this.index].value
        };
        this.nextToken();

        // Process as long as there are tokens and the current token is an operator
        while (this.tokens[this.index] && this.tokens[this.index].Type === Type.OPERATOR) {
            const operator = this.tokens[this.index].value;
            this.nextToken();
            if (!this.tokens[this.index] || this.tokens[this.index].Type !== Type.NUMBER) {
                throw new Error("Syntax Error: Expected a number after operator");
            }

            const right = {
                'Type': 'Literal',
                'value': this.tokens[this.index].value
            };

            left = {
                'Type': 'BinaryOperation',
                'operator': operator,
                'left': left,
                'right': right
            };
            this.nextToken();
        }

        return left;
    }
}

class Interpreter {
    constructor() {}

    evaluateAST(ast) {
        switch (ast['Type']) {
            case 'Literal':
                return parseInt(ast['value']);  // Convert the value to an integer and return it
            case 'BinaryOperation':
                const leftVal = this.evaluateAST(ast['left']);  // Recursively evaluate the left child
                const rightVal = this.evaluateAST(ast['right']);  // Recursively evaluate the right child

            // Perform the operation based on the operator
            switch (ast['operator']) {
                case 'sprinkles':
                    return leftVal + rightVal;
                case 'ice':
                    return leftVal - rightVal;
                case 'caffeine':
                    return leftVal * rightVal;
                case 'frappe':
                    if (rightVal === 0) {
                        throw new Error("Division by zero");  // Handle division by zero
                    }
                    return leftVal / rightVal;
                default:
                    throw new Error(`Unsupported operator: ${ast['operator']}`);
            }
            case 'Assignment':
                // Evaluate the value of the assignment and store it in the variable
                const value = this.evaluateAST(ast['value']);
                // For simplicity, assume the variable is already defined and just return its value
                return value;
            default:
                throw new Error(`Unsupported node type: ${ast['Type']}`);
        }
        }
    }


let debug = true;
let input = "";

const fs = require('fs');

// Check if the input file argument is provided
if (process.argv.length < 3) {
    console.log("Usage: node interpret.js demo.chip");
    process.exit(1);
}

// Get the filename from command line arguments
const filePath = process.argv[2];

try {
    // Read the file synchronously
    input = fs.readFileSync(filePath, 'utf8');
    console.log("here");
} catch (err) {
    console.error(err);
}


if (debug) {
    console.log("\n--------INPUT--------");
    console.log(input);
}

const tokens = new Lexer(input).lex();

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

if (debug) {
    console.log("\n--------RESULT--------");
    console.log(` The result of your line of code is: ${result}\n`);
} else {
    console.log(result);
}
