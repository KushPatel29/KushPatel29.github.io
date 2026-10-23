# Résumé source

`resume.html` is the source for `../assets/Kush-Patel-Resume.pdf`. Edit the HTML,
rebuild, and the PDF the site hands out changes with it.

It lives here because it did not exist. The served PDF had no editable source —
76 PDFs and 4 `.docx` files in a local folder, none of them the file the site was
linking — so the only way to correct anything in it was to rebuild it from
scratch. That is how it drifted: the copy dated 2026-08-05 still said the Two
Rivers role was current and put the wrong city in the header, while the site said
otherwise on the same screen, and it named none of the twelve projects the rest
of the portfolio is built on.

## Role variants

`roles/*.html` are the same person, dates and projects, ordered and worded for one
role family each: data scientist, analytics engineer, data engineer, business
analyst, financial analyst, and AML / financial-crime analyst. `resume.html` stays
the general résumé for data analyst, BI and supply-chain roles. All of them share
`resume.css`, and `tools/check-resume.mjs` holds every one to the facts the site
states (end dates, city, the master's dates, each listed project being on the page,
no headline test totals) and requires each variant's PDF to be offered on the page.

## Rebuild

```bash
bash resume/build-all.sh      # every PDF
bash resume/build.sh          # just assets/Kush-Patel-Resume.pdf
```

Chrome renders it; nothing else is required. `build.sh` inlines `resume.css` into
a temporary copy first, so a source copied elsewhere for one application renders
identically. The general PDF is what the site's calls to action link to; each
role view links its own variant.

## Rules it is built to

- **Two pages.** `build.sh` fails if it is not, because a résumé that spills onto
  a third page is a résumé nobody finishes reading.
- **A font with a real text layer.** `resume.css` asks for Carlito first, then
  Calibri, which shares its metrics, so a Windows build lays out identically. The
  stylesheet used to lead with Segoe UI; where that is missing, Chrome fell back to
  Inter and embedded it as a Type 3 font whose punctuation extracted as
  private-use characters, so an applicant-tracking system could not read the phone
  number, "4+ years" or any hyphen. CI now runs the job-scout ATS check on every
  PDF.
- **Single column, real text, standard headings.** Applicant tracking systems
  parse this file before a person sees it; multi-column layouts and text baked
  into images are the two reliable ways to be filtered out.
- **Every number is one the portfolio can prove.** The test counts, WAPE, match
  rate and dollar figures here are the same values the repositories assert in CI.
  If one of those changes, this document is stale and should be rebuilt.
- **The dates and the site agree.** The employment period stated here is the one
  on the site's experience section. They are read in the same sitting.
