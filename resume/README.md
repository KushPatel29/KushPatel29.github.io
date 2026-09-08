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

## Rebuild

```bash
bash resume/build.sh
```

Chrome renders it; nothing else is required. The output is written straight to
`assets/Kush-Patel-Resume.pdf`, which five calls-to-action on the site link to.

## Rules it is built to

- **Two pages.** `build.sh` fails if it is not, because a résumé that spills onto
  a third page is a résumé nobody finishes reading.
- **Single column, real text, standard headings.** Applicant tracking systems
  parse this file before a person sees it; multi-column layouts and text baked
  into images are the two reliable ways to be filtered out.
- **Every number is one the portfolio can prove.** The test counts, WAPE, match
  rate and dollar figures here are the same values the repositories assert in CI.
  If one of those changes, this document is stale and should be rebuilt.
- **The dates and the site agree.** The employment period stated here is the one
  on the site's experience section. They are read in the same sitting.
