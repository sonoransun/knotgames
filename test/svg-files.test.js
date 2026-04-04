import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import { JSDOM } from 'jsdom';

const DIAGRAMS_DIR = join(import.meta.dirname, '..', 'diagrams');

function findSVGs(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findSVGs(fullPath));
    } else if (entry.name.endsWith('.svg')) {
      results.push(fullPath);
    }
  }
  return results;
}

const svgFiles = findSVGs(DIAGRAMS_DIR);

describe('static SVG file validation', () => {
  it('found SVG files', () => {
    expect(svgFiles.length).toBeGreaterThan(0);
  });

  for (const filePath of svgFiles) {
    const relPath = relative(join(import.meta.dirname, '..'), filePath);

    describe(relPath, () => {
      let content;
      let doc;

      it('is non-empty', () => {
        const stat = statSync(filePath);
        expect(stat.size).toBeGreaterThan(0);
      });

      it('is valid XML', () => {
        content = readFileSync(filePath, 'utf-8');
        const dom = new JSDOM(content, { contentType: 'application/xml' });
        doc = dom.window.document;
        // Check for parse errors — JSDOM wraps parse errors in <parsererror>
        const parseError = doc.querySelector('parsererror');
        expect(parseError).toBeNull();
      });

      it('has SVG root element with correct namespace', () => {
        if (!doc) {
          content = readFileSync(filePath, 'utf-8');
          const dom = new JSDOM(content, { contentType: 'application/xml' });
          doc = dom.window.document;
        }
        const svg = doc.documentElement;
        expect(svg.tagName).toBe('svg');
        expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
      });

      it('has viewBox attribute', () => {
        if (!doc) {
          content = readFileSync(filePath, 'utf-8');
          const dom = new JSDOM(content, { contentType: 'application/xml' });
          doc = dom.window.document;
        }
        expect(doc.documentElement.getAttribute('viewBox')).not.toBeNull();
      });

      it('has <title> element', () => {
        if (!doc) {
          content = readFileSync(filePath, 'utf-8');
          const dom = new JSDOM(content, { contentType: 'application/xml' });
          doc = dom.window.document;
        }
        const title = doc.querySelector('title');
        expect(title).not.toBeNull();
        expect(title.textContent.trim().length).toBeGreaterThan(0);
      });

      it('has <desc> element', () => {
        if (!doc) {
          content = readFileSync(filePath, 'utf-8');
          const dom = new JSDOM(content, { contentType: 'application/xml' });
          doc = dom.window.document;
        }
        const desc = doc.querySelector('desc');
        expect(desc).not.toBeNull();
        expect(desc.textContent.trim().length).toBeGreaterThan(0);
      });
    });
  }
});
