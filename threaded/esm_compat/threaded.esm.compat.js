import * as acorn from "https://esm.sh/acorn@latest";
import * as walk from "https://esm.sh/acorn-walk@latest";
import * as escodegen from "https://esm.sh/escodegen@latest";

export class ThreadedEsmCompat {
    static defaultSettings(ThreadedTools) {
        ThreadedTools.ast_generator = acorn;
        ThreadedTools.ast_walker = walk;
        ThreadedTools.escodegenerator = escodegen;
        ThreadedTools.isesm = true;
    }
}