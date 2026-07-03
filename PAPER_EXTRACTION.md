# KSNVE abstract-book extraction

The extraction pipeline matches abstract-book pages against the existing
program-paper titles and stages one UTF-8 XML document per paper. Existing app
data is never changed by the extraction command.

## 1. Add the source PDF

The default inputs are:

```text
source-pdf/abstract-book.pdf
source-pdf/program-book.pdf
```

Alternatively, pass an absolute or relative path with `--input`.

## 2. Extract to staging

```bash
npm run extract:papers
```

Custom paths are supported:

```bash
npm run extract:papers -- --input source-pdf/abstract-book.pdf --program source-pdf/program-book.pdf --output .paper-extraction/latest
```

The command creates only staged output:

```text
.paper-extraction/latest/
├── papers-xml/p001.xml
├── papers-xml/...
├── papers.json
├── extraction-report.json
└── extraction-report.md
```

The report records extraction totals, source-page matches, extracted abstracts,
missing fields, and parsing errors.

## 3. Validate

```bash
npm run validate:papers
```

Validation checks:

- the XML count matches the program-paper count;
- every expected program paper ID is present and unique;
- required program metadata is present; unavailable abstract/source fields are
  preserved as empty values and reported as extraction warnings;
- dates, times, filenames, and source-page numbers are valid;
- staged `papers.json` contains exactly the same records as the XML files.

Results are written to `validation-report.json` and `validation-report.md` in
the staging directory.

## 4. Promote only validated output

```bash
npm run validate:papers -- --promote
```

Promotion is blocked unless validation has zero errors. On success, the staged
XML directory is atomically copied to `data/papers-xml/`, the generated JSON is
written to `data/papers-with-abstracts.json` without replacing `data/papers.json`, and the final report is saved as
`data/papers-extraction-report.json`.

The generated JSON retains the app-compatible `id`, `sessionId`, and `flags`
properties while also including XML metadata such as `paper_id`, affiliations,
abstract, keywords, and `source_page`.

## Current extraction status

- Pipeline implementation: complete
- Source PDFs found in workspace: yes
- XML papers generated: 248
- Abstracts extracted: 244
- Source pages matched: 245
- Validation: passed (248/248 XML, 0 parsing errors)
- Extraction warnings: `p085`, `p086`, `p087` have no individual abstract page;
  `p205` has a source page containing metadata but no abstract body
- Existing `data/papers.json` modified: no
- Default inputs: `source-pdf/abstract-book.pdf`, `source-pdf/program-book.pdf`

## Figure extraction

Figures are not yet extracted. A future pipeline step should add rendered paper
page images through `pageImage`, or individual figure image paths through
`figures[].image`, so visual content can be verified and displayed alongside
the extracted text.
