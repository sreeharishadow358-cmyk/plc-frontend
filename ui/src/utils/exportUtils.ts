import { LadderRung, LadderBlock } from '@/types/ladder';

// ── Download trigger ──────────────────────────────────────────────────────────

export function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.setAttribute('download', filename); // use setAttribute to ensure it's honored
    a.style.display = 'none';

    // Sometimes frameworks intercept anchor clicks, these prevent it
    a.target = '_blank';
    a.rel = 'noopener noreferrer';

    document.body.appendChild(a);
    a.click();

    // Small delay ensures the browser starts downloading with the correct name
    // before the blob source is revoked, preventing the fallback UUID naming.
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 200);
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function escapeXml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Splits LadderRung array into flat blocks for compatibility. */
function flattenRungs(rungs: LadderRung[]): LadderBlock[] {
    return rungs.flatMap(rung => rung.blocks);
}

/** Splits a flat LadderBlock array into rungs — each coil terminates a rung. */
function splitIntoRungs(blocks: LadderBlock[]): LadderBlock[][] {
    const rungs: LadderBlock[][] = [];
    let current: LadderBlock[] = [];
    for (const block of blocks) {
        current.push(block);
        if (block.type === 'coil') {
            rungs.push(current);
            current = [];
        }
    }
    if (current.length > 0) rungs.push(current); // incomplete rung
    return rungs;
}

// ── PLCopen TC6 XML ───────────────────────────────────────────────────────────

/**
 * Builds a PLCopen TC6 XML document for GX Works3 ladder import.
 * Import path: File → Import → PLCopen XML
 *
 * LadderBlock → LD element mapping:
 *   contact    → <contact>               (Normally Open)
 *   contact_nc → <contact negated="true"> (Normally Closed)
 *   coil       → <coil>                  (Output Coil)
 */
export function buildPLCopenXML(ladderData: LadderRung[], instructionList: string): string {
    const now = new Date().toISOString().slice(0, 19);
    const blocks = flattenRungs(ladderData);
    const rungs = splitIntoRungs(blocks);

    const rungLines: string[] = [];
    for (const rung of rungs) {
        rungLines.push('        <rung>');
        rung.forEach((block, idx) => {
            const v = escapeXml(block.label);
            if (block.type === 'contact') {
                rungLines.push(
                    `          <contact><position x="${idx}" y="0"/><variable>${v}</variable></contact>`
                );
            } else if (block.type === 'contact_nc') {
                rungLines.push(
                    `          <contact negated="true"><position x="${idx}" y="0"/><variable>${v}</variable></contact>`
                );
            } else {
                // coil — placed at x=5 minimum to leave clearance from contacts
                rungLines.push(
                    `          <coil><position x="${Math.max(idx, 5)}" y="0"/><variable>${v}</variable></coil>`
                );
            }
        });
        rungLines.push('        </rung>');
    }

    const ilComment = instructionList
        ? [
            '',
            '        <!--',
            '          Instruction List (Mitsubishi GX Works mnemonic):',
            ...instructionList.split('\n').map((l) => `          ${l}`),
            '        -->',
            '',
        ].join('\n')
        : '';

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<project xmlns="http://www.plcopen.org/xml/tc6_0201">',
        `  <fileHeader companyName="AI PLC Generator" productName="GX Works3 Import" productVersion="1.0" creationDateTime="${now}"/>`,
        `  <contentHeader name="ladder_export" modificationDateTime="${now}">`,
        '    <coordinateInfo>',
        '      <fbd><scaling x="1" y="1"/></fbd>',
        '      <ld><scaling x="1" y="1"/></ld>',
        '      <sfc><scaling x="1" y="1"/></sfc>',
        '    </coordinateInfo>',
        '  </contentHeader>',
        '  <types><dataTypes/><pous>',
        '    <pou name="MAIN" pouType="program">',
        '      <body><LD>' + ilComment + rungLines.join('\n'),
        '      </LD></body>',
        '    </pou>',
        '  </pous></types>',
        '  <instances><configurations/></instances>',
        '</project>',
    ].join('\n');
}

// ── GX Works3 Label CSV ───────────────────────────────────────────────────────

/**
 * Builds a GX Works3 device label import CSV.
 * Import path: Tools → Import → Label
 *
 * Column mapping:
 *   contact    → Class: VAR_INPUT
 *   contact_nc → Class: VAR_INPUT
 *   coil       → Class: VAR_OUTPUT
 */
export function buildGXWorksLabelCSV(ladderData: LadderRung[]): string {
    const blocks = flattenRungs(ladderData);
    const header = '"Label Name","Data Type","Class","Device","Comment"';
    const rows = blocks.map((block) => {
        const cls = block.type === 'coil' ? 'VAR_OUTPUT' : 'VAR_INPUT';
        const comment =
            block.type === 'contact'
                ? 'Start contact'
                : block.type === 'contact_nc'
                    ? 'Stop contact NC'
                    : 'Output coil';
        return `"${block.label}","Bit","${cls}","${block.label}","${comment}"`;
    });
    return [header, ...rows].join('\n');
}
