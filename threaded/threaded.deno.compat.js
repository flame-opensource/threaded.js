import * as acorn from "https://esm.sh/acorn@latest";
import * as walk from "https://esm.sh/acorn-walk@latest";
import * as escodegen from "https://esm.sh/escodegen@latest";

export class ThreadedDenoCompat {
    static supportDeno(ThreadedTools) {
        ThreadedTools.acorn = acorn;
        ThreadedTools.walk = walk;
        ThreadedTools.escodegen = escodegen;
    }
}