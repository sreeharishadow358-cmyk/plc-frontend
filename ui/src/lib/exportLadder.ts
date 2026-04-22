import { LadderBlock } from '@/types/ladder';

// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeXml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Splits a flat LadderBlock array into rungs.
 * Each coil block marks the end of a rung (mirrors IEC 61131-3 ladder rungs).
 */
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
    if (current.length > 0) rungs.push(current); // incomplete rung (no coil)
    return rungs;
}

// ── Rung XML builder ──────────────────────────────────────────────────────────

const X_STEP = 80; // horizontal spacing between elements (px, arbitrary units)

interface RungResult {
    xml: string;
    nextLocalId: number;
}

/**
 * Produces the PLCopen XML fragment for a single ladder rung.
 * LocalIds are allocated sequentially across all rungs so they remain unique
 * within the POU body.
 *
 *  Structure per rung:
 *    leftPowerRail → contact(s) → coil → rightPowerRail
 *  Each element references the previous element via <connection refLocalId="…"/>.
 */
function buildRungXml(blocks: LadderBlock[], startLocalId: number): RungResult {
    let id = startLocalId;
    const lines: string[] = [];

    // Left power rail ─────────────────────────────────────────────────────────
    const leftRailId = id++;
    lines.push(
        `        <leftPowerRail localId="${leftRailId}">`,
        `          <position x="0" y="0"/>`,
        `          <connectionPointOut>`,
        `            <relPosition x="30" y="25"/>`,
        `          </connectionPointOut>`,
        `        </leftPowerRail>`
    );

    let prevId = leftRailId;
    let x = X_STEP;

    // Contacts ────────────────────────────────────────────────────────────────
    const contacts = blocks.filter((b) => b.type !== 'coil');
    const coil = blocks.find((b) => b.type === 'coil');

    for (const block of contacts) {
        const elemId = id++;
        const negated = block.type === 'contact_nc' ? 'true' : 'false';
        lines.push(
            `        <contact localId="${elemId}" negated="${negated}">`,
            `          <position x="${x}" y="0"/>`,
            `          <connectionPointIn>`,
            `            <relPosition x="0" y="25"/>`,
            `            <connection refLocalId="${prevId}"/>`,
            `          </connectionPointIn>`,
            `          <connectionPointOut>`,
            `            <relPosition x="60" y="25"/>`,
            `          </connectionPointOut>`,
            `          <variable>${escapeXml(block.label)}</variable>`,
            `        </contact>`
        );
        prevId = elemId;
        x += X_STEP;
    }

    // Output coil ─────────────────────────────────────────────────────────────
    if (coil) {
        const coilId = id++;
        lines.push(
            `        <coil localId="${coilId}" coilType="COIL">`,
            `          <position x="${x}" y="0"/>`,
            `          <connectionPointIn>`,
            `            <relPosition x="0" y="25"/>`,
            `            <connection refLocalId="${prevId}"/>`,
            `          </connectionPointIn>`,
            `          <connectionPointOut>`,
            `            <relPosition x="60" y="25"/>`,
            `          </connectionPointOut>`,
            `          <variable>${escapeXml(coil.label)}</variable>`,
            `        </coil>`
        );
        prevId = coilId;
        x += X_STEP;
    }

    // Right power rail ────────────────────────────────────────────────────────
    const rightRailId = id++;
    lines.push(
        `        <rightPowerRail localId="${rightRailId}">`,
        `          <position x="${x}" y="0"/>`,
        `          <connectionPointIn>`,
        `            <relPosition x="0" y="25"/>`,
        `            <connection refLocalId="${prevId}"/>`,
        `          </connectionPointIn>`,
        `        </rightPowerRail>`
    );

    const xml = `      <rung>\n${lines.join('\n')}\n      </rung>`;
    return { xml, nextLocalId: id };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generates a PLCopen XML document conforming to the IEC 61131-3 TC6 schema
 * (http://www.plcopen.org/xml/tc6_0201).
 *
 * The Instruction List is embedded as an XML comment inside the LD body so
 * that Mitsubishi GX Works users can cross-reference the mnemonic form.
 *
 * @param ladder          Array of LadderBlock from the Zustand store
 * @param instructionList GX Works mnemonic instruction list string
 * @param programName     POU name (default "MAIN")
 */
export function generatePLCopenXML(
    ladder: LadderBlock[],
    instructionList: string,
    programName = 'MAIN'
): string {
    const now = new Date().toISOString().slice(0, 19); // "YYYY-MM-DDTHH:MM:SS"
    const safeName = escapeXml(programName);

    // Build rung XML fragments
    const rungs = splitIntoRungs(ladder);
    let nextLocalId = 1;
    const rungFragments: string[] = [];
    for (const rung of rungs) {
        const result = buildRungXml(rung, nextLocalId);
        rungFragments.push(result.xml);
        nextLocalId = result.nextLocalId;
    }

    // Embed Instruction List as a comment for GX Works cross-reference
    const ilComment = instructionList
        ? [
              ``,
              `      <!--`,
              `        Instruction List (Mitsubishi GX Works mnemonic):`,
              ...instructionList.split('\n').map((l) => `        ${l}`),
              `      -->`,
              ``,
          ].join('\n')
        : '';

    return [
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<project xmlns="http://www.plcopen.org/xml/tc6_0201"`,
        `         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"`,
        `         xsi:schemaLocation="http://www.plcopen.org/xml/tc6_0201`,
        `                             http://www.plcopen.org/xml/tc6_0201">`,
        ``,
        `  <fileHeader`,
        `    companyName="AI PLC Studio"`,
        `    productName="Mitsubishi PLC Ladder Logic IDE"`,
        `    productVersion="1.0"`,
        `    creationDateTime="${now}"/>`,
        ``,
        `  <contentHeader name="${safeName}" modificationDateTime="${now}">`,
        `    <coordinateInfo>`,
        `      <fbd><scaling x="1" y="1"/></fbd>`,
        `      <ld><scaling x="1" y="1"/></ld>`,
        `      <sfc><scaling x="1" y="1"/></sfc>`,
        `    </coordinateInfo>`,
        `  </contentHeader>`,
        ``,
        `  <types>`,
        `    <dataTypes/>`,
        `    <pous>`,
        `      <pou name="${safeName}" pouType="program">`,
        `        <interface>`,
        `          <localVars/>`,
        `        </interface>`,
        `        <body>`,
        `          <LD>${ilComment}${rungFragments.join('\n')}`,
        `          </LD>`,
        `        </body>`,
        `      </pou>`,
        `    </pous>`,
        `  </types>`,
        ``,
        `  <instances>`,
        `    <configurations>`,
        `      <configuration name="Config">`,
        `        <resource name="Resource1">`,
        `          <task name="MainTask" priority="1" interval="T#20ms">`,
        `            <pouInstance name="${safeName}" typeName="${safeName}"/>`,
        `          </task>`,
        `        </resource>`,
        `      </configuration>`,
        `    </configurations>`,
        `  </instances>`,
        ``,
        `</project>`,
    ].join('\n');
}
