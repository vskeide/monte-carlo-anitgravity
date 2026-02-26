/* ---------------------------------------------------------------
 * global.d.ts — Global type declarations for Office custom functions
 * --------------------------------------------------------------- */

declare namespace CustomFunctions {
    function associate(
        name: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: (...args: any[]) => any
    ): void;
}

// Extend Office with actions.associate (used by ribbon commands)
declare namespace Office {
    namespace actions {
        function associate(
            name: string,
            callback: (event: Office.AddinCommands.Event) => void
        ): void;
    }
}
