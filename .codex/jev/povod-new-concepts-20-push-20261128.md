# Additional Povod concepts and Git publication

Owner request: "Нагинирь подобных ещё каких-то разных концепций, которых уже не было? И запушим гит тоже."

Default scope: 20 new photographs, a quantity chosen by the implementer because the user did not specify a new count. Preserve the previous 50. Use the same warm photographic treatment, with new actions and settings. Branch: content/povod-people-events-50. Website integration and merging into main are outside this task.

## Concepts

Create assets/collections/photo-concepts-20 with catalog.json, prompts.md, references.md and README.md. Use these exact IDs, themes and independent scenes:

| ID | Theme | Scene |
|---|---|---|
| pc001 | graduation | A graduate raises her removed academic cap after the ceremony. |
| pc002 | housewarming | A woman unlocks her first apartment, with a plant and moving boxes. |
| pc003 | retirement | Colleagues farewell a retiring woman at her emptied desk with a gift and personal box. |
| pc004 | theatre-premiere | An amateur troupe bows holding hands beside a stage curtain. |
| pc005 | new-pet | A woman meets her new puppy, whose front paws rest on her knees. |
| pc006 | newborn | A seated father safely holds a fully clothed newborn, supporting the head. |
| pc007 | reunion | Two sisters meet after a long separation on a station platform with luggage. |
| pc008 | race-finish | An amateur runner crosses a plain finish ribbon to a loved one's welcome. |
| pc009 | teacher-thanks | A teacher tries a scarf given by adult former students in a classroom. |
| pc010 | first-steps | A toddler takes first steps between parents seated on the floor. |
| pc011 | business-opening | A bakery owner places the first tray of rolls on the opening-day counter. |
| pc012 | career-start | A young veterinarian puts on her first work coat, helped by a mentor. |
| pc013 | first-bike | A father releases the saddle as a helmeted child first rides independently. |
| pc014 | first-school-day | A mother adjusts a first-grader's backpack near school, with the father waiting. |
| pc015 | first-book | An author unpacks a first printed book with a plain unlettered cover. |
| pc016 | music-debut | An adult beginner saxophonist finishes a first public number while a friend applauds. |
| pc017 | first-exhibition | An artist unwraps a framed original abstract painting at her first small gallery exhibition. |
| pc018 | volunteer-project | Volunteers finish restoring a courtyard bench, remove masking tape and exchange a high five. |
| pc019 | family-tree-planting | Three generations plant a young tree using soil and a small watering can. |
| pc020 | pottery | Friends inspect their first fresh uneven ceramic bowl with clay-covered hands and laughter. |

Compare these subjects with all 50 previous catalog titles/prompts and the 12 older Povod photos. Apple harvest is excluded because old jub-family already shows apples; pc017 is an exhibition instead. Avoid new versions of existing cake tables, flower-giving portraits, wedding pairs, cafe pairs and holiday poses. Existing reference URLs inform light and photographic treatment only; do not claim they depict these new events. Check: 20 distinct themes and actions, one row per ID, unique complete prompts and honest reference notes.

## Generate and review

Use built-in image_gen only, one call per original. Invent distinct people and believable gestures, with realistic skin and continuous photographs from top to bottom. Exclude writing, logos, watermarks, gradient masks and fake caption bands. Vary the new locations and lighting within the established warm style. Editorial IDs are pc004, pc005, pc010, pc015, pc019 and pc020; the other 14 are documentary. Repeat portrait/portrait/landscape/landscape/square four times: 8 portraits at 4:5, 8 landscapes at 16:9 and 4 squares, with cover/cover/section/section/gallery roles. Keep main faces and important gestures safe in central 4:3 and 1.65 landscape crops. A central 55 percent is only a prompt hint, not an acceptance threshold. Preserve a natural portrait caption area. Never stretch or upscale masters. Save originals/pcNNN.png and actual prompts plus individual visual reviews. Inspect every actual output, replace defects and keep rejected variants local outside originals. Check: 20 visually accepted originals with correct subjects, geometry and unique hashes.

## Prepare and validate

Minimally extend codex/prepare_people_events_pack.py with --profile people-events-50|photo-concepts-20; retain the old profile by default. Reuse shared image, path, hash, preview and contact-sheet logic. Profiles define exact IDs, style/theme assignments and counts. Preserve strict validation of the old 50. The new profile has one exact theme per ID as above, 14 documentary/6 editorial and 8 portrait/8 landscape/4 square images. Produce 20 native PNGs, 40 JPEG/WebP previews and two contact sheets of ten photographs, plus the catalog and documentation. --check is read-only; --prepare preserves masters and never accepts images automatically. Check both real collections. Negative tests reject swapped old assignments, repeated new themes, incorrect profiles, missing files and duplicate hashes. Compare read-only snapshots and master hashes. Inspect the final sheets and new crops. Preserve all previous photographs; update documentation only where needed for the new profile.

## Commit and push

The user authorized commit and push. The prior 50 are committed as f7e35b2. Stage only exact collection files, the shared script, HANDOFF and reviewed plan Markdown. Exclude local ZIP archives, files above 100 MiB, rejected images, QA, run logs, helpers, local state and hash receipts. Never use git add dot. Inspect the staged allowlist, added private-machine paths/secrets, file sizes and git diff --check. Commit the new collection and minimal profile changes using a short Russian message. Push content/povod-people-events-50 and verify git ls-remote equals local HEAD. Do not force push or change main. Final chat shows two new contact sheets and links the actual prompts and remote branch/commit. Check: the exact remote HEAD contains both manifests and all 70 native files; local archives remain untracked and website files remain unchanged.
