# Chemicals Missing Detailed Information

## Summary

- **Total chemicals in CSV files (database):** 313
- **Total chemicals in JSON files (with detailed info):** 259 (updated)
- **Chemicals missing detailed information:** 86 (updated)

---

## Complete List of Missing Chemicals by Category

### Agricultural Chemicals (31 chemicals)

**✅ Recently Added (19 chemicals):**
- (E)-Fenpyroximate ✓
- Abamectin ✓
- Acibenzolar-S-methyl ✓
- Aminocarb ✓
- Benalaxyl ✓
- Benfuracarb ✓
- Benzoximate ✓
- Bifenazate ✓
- Bupirimate ✓
- Dimoxystrobin ✓
- Doramectin ✓
- Emamectin-benzoate ✓
- Ethofumesate ✓
- Fluoxastrobin ✓
- Formetanate HCL ✓
- Monceren (Pencycuron) ✓
- Moxidectin ✓
- Novaluron ✓
- Oxadixyl ✓

**Still Missing:**
1. Buprofezin
2. Chlorantraniliprole
3. Chlorfluazuron
4. Clofentezine
5. Cymoxanil
6. Diflubenzuron
7. Etoxazole
8. Fenazaquin
9. Fenobucarb (BPMC)
10. Flubendiamide
11. Flufenacet (Fluthiamide)
12. Flufenoxuron
13. Furalaxyl
14. Furathiocarb
15. Halofenozide
16. Hexaflumuron
17. Hexythiazox
18. Iprovalicarb
19. Mepronil
20. Metalaxyl
21. Oxamyl
22. Picoxystrobin
23. Pirimicarb
24. Propamocarb (free base)
25. Propoxur (Baygon)
26. Spirodiclofen
27. Tebufenpyrad
28. Teflubenzuron
29. Thiofanox
30. Triflumuron
31. Zoxamide

### Containers & Coatings (7 chemicals)

1. 1H,1H,2H,2H-Perfluorohexanesulfonic acid
2. 1H,1H,2H,2H-Perfluorooctanesulfonic acid
3. Heptadecafluorooctanesulfonic acid (PFOS)*
4. N-ethylperfluoro-1-octanesulfonamidoacetic acid (NEtFOSAA)*
5. N-methylperfluoro-1-octanesulfonamidoacetic acid (NMeFOSAA)*
6. Perfluorohexanesulfonic acid (PFHxS)*
7. Perfluorooctanoic acid (PFOA)*

### Household Products (1 chemical)

1. Isophorone

### Industrial Chemicals (31 chemicals)

**✅ Recently Added (5 chemicals):**
- 1,3-Dichlorobenzene ✓
- 1,3-Dinitrobenzene ✓
- 2-Chlorophenol ✓
- 2-Nitroaniline ✓
- 2-Nitrophenol ✓

**Note:** 2-Methylphenol (o-cresol) already existed in the database.

**Still Missing:**
1. 2,2'-Oxybis (a.k.a. Bis(2-chloroisopropyl) ether)
2. 2,4-Dinitrophenol
3. 2,4-Dinitrotoluene
4. 2,4,5-Trichlorophenol
5. 2,6-Dinitrotoluene
6. 3-Methylcholanthrene
7. 3-Methylphenol (m-cresol)
8. 3-Nitroaniline
9. 3,3'-Dichlorobenzidine
10. 4-Bromophenylphenyl ether
11. 4-Chloroaniline
12. 4-Chlorophenylphenyl ether
13. 4-Methylphenol (p-cresol)
14. 4-Nitroaniline
15. 4-Nitroquinoline-N-oxide
16. Acenaphthene
17. Acenaphthylene
18. Anthracene
19. Benzo[b]fluoranthene
20. Benzo[c]fluorene
21. Benzo[g,h,i]perylene
22. Benzo[j]fluoranthene
23. Benzo[k]fluoranthene
24. Bis(2-chloroethyl)ether (111-44-4)
25. Chrysene
26. Dibenzo[a,e]pyrene
27. Dibenzo[a,h]pyrene
28. Naphthalene
29. Nitrobenzene
30. Pyridine

### Persistent Pollutants (3 chemicals)

1. 11-chloro eicosafluoro-3-oxaundecane-1-sulfonic acid
2. Butoxycarboxim
3. Kresoxim-methyl

### Personal Care Products (13 chemicals)

1. 4-Chloro-3-methylphenol
2. Benzyl butyl phthalate
3. Bis(2-ethoxyethyl)phthalate
4. Bis(2-ethylhexyl)phthalate
5. Bis(2-methoxyethyl)phthalate
6. Bis(2-n-butoxyethyl)phthalate
7. Bis(4-methyl-2-pentyl)phthalate
8. Di-n-butylphthalate
9. Di-n-nonylphthalate
10. Di-n-octylphthalate
11. Diethylphthalate
12. Dipentylphthalate
13. Phthalic acid diisobutyl ester

---

## Notes

- These chemicals exist in the CSV database files (`public/data/p1/all-chemicals_test*.csv`) but do not have corresponding entries with detailed information in the JSON files (`src/data/chemicals/*.json`).
- The detailed information includes `summary_sections` with content about overview, exposure pathways, health information, and regulatory context.
- To complete the database, detailed information needs to be added for these 86 chemicals in their respective category JSON files.
- **Update:** 19 chemicals have been recently added to the Agricultural Chemicals category, and 5 chemicals have been recently added to the Industrial Chemicals category (see lists above).

---

## Complete Combined List (All 86 Missing Chemicals)

**Note:** 19 chemicals have been recently added to Agricultural Chemicals, and 5 chemicals have been recently added to Industrial Chemicals (marked with ✓):

**Agricultural Chemicals:**
- (E)-Fenpyroximate ✓
- Abamectin ✓
- Acibenzolar-S-methyl ✓
- Aminocarb ✓
- Benalaxyl ✓
- Benfuracarb ✓
- Benzoximate ✓
- Bifenazate ✓
- Bupirimate ✓
- Dimoxystrobin ✓
- Doramectin ✓
- Emamectin-benzoate ✓
- Ethofumesate ✓
- Fluoxastrobin ✓
- Formetanate HCL ✓
- Monceren (Pencycuron) ✓
- Moxidectin ✓
- Novaluron ✓
- Oxadixyl ✓

**Industrial Chemicals:**
- 1,3-Dichlorobenzene ✓
- 1,3-Dinitrobenzene ✓
- 2-Chlorophenol ✓
- 2-Nitroaniline ✓
- 2-Nitrophenol ✓

1. 1H,1H,2H,2H-Perfluorohexanesulfonic acid
2. 1H,1H,2H,2H-Perfluorooctanesulfonic acid
3. 11-chloro eicosafluoro-3-oxaundecane-1-sulfonic acid
4. 2,2'-Oxybis (a.k.a. Bis(2-chloroisopropyl) ether)
5. 2,4-Dinitrophenol
6. 2,4-Dinitrotoluene
7. 2,4,5-Trichlorophenol
8. 2,6-Dinitrotoluene
9. 3-Methylcholanthrene
10. 3-Methylphenol (m-cresol)
11. 3-Nitroaniline
12. 3,3'-Dichlorobenzidine
13. 4-Bromophenylphenyl ether
14. 4-Chloro-3-methylphenol
15. 4-Chloroaniline
16. 4-Chlorophenylphenyl ether
17. 4-Methylphenol (p-cresol)
18. 4-Nitroaniline
19. 4-Nitroquinoline-N-oxide
20. Acenaphthene
21. Acenaphthylene
22. Anthracene
23. Benzo[b]fluoranthene
24. Benzo[c]fluorene
25. Benzo[g,h,i]perylene
26. Benzo[j]fluoranthene
27. Benzo[k]fluoranthene
28. Benzyl butyl phthalate
29. Bis(2-chloroethyl)ether (111-44-4)
30. Bis(2-ethoxyethyl)phthalate
31. Bis(2-ethylhexyl)phthalate
32. Bis(2-methoxyethyl)phthalate
33. Bis(2-n-butoxyethyl)phthalate
34. Bis(4-methyl-2-pentyl)phthalate
35. Buprofezin
36. Butoxycarboxim
37. Chlorantraniliprole
38. Chlorfluazuron
39. Chrysene
40. Clofentezine
41. Cymoxanil
42. Dibenzo[a,e]pyrene
43. Dibenzo[a,h]pyrene
44. Diflubenzuron
45. Di-n-butylphthalate
46. Di-n-nonylphthalate
47. Di-n-octylphthalate
48. Diethylphthalate
49. Dipentylphthalate
50. Etoxazole
51. Fenazaquin
52. Fenobucarb (BPMC)
53. Flubendiamide
54. Flufenacet (Fluthiamide)
55. Flufenoxuron
56. Furalaxyl
57. Furathiocarb
58. Halofenozide
59. Heptadecafluorooctanesulfonic acid (PFOS)*
60. Hexaflumuron
61. Hexythiazox
62. Iprovalicarb
63. Isophorone
64. Kresoxim-methyl
65. Mepronil
66. Metalaxyl
67. N-ethylperfluoro-1-octanesulfonamidoacetic acid (NEtFOSAA)*
68. N-methylperfluoro-1-octanesulfonamidoacetic acid (NMeFOSAA)*
69. Naphthalene
70. Nitrobenzene
71. Oxamyl
72. Perfluorohexanesulfonic acid (PFHxS)*
73. Perfluorooctanoic acid (PFOA)*
74. Phthalic acid diisobutyl ester
75. Picoxystrobin
76. Pirimicarb
77. Propamocarb (free base)
78. Propoxur (Baygon)
79. Pyridine
80. Spirodiclofen
81. Tebufenpyrad
82. Teflubenzuron
83. Thiofanox
84. Triflumuron
85. Zoxamide

