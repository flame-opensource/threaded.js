class ThreadedBrowserCompat {
    static defaultSettings(ThreadedTools) {
        ThreadedTools.ast_generator = acorn;
        ThreadedTools.ast_walker = acorn.walk;
        ThreadedTools.escodegenerator = escodegen;
    }
}

ThreadedBrowserCompat.defaultSettings(ThreadedTools);