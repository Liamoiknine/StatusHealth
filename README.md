# StatusHealth

StatusHealth is a startup centered around accurate measurement of environmental exposures in your blood, currently not measured elsewhere.

## Project Overview

StatusHealth is a health status monitoring application for tracking chemical exposures from biomonitoring test data. The application visualizes and analyzes chemical exposure data across multiple test dates, organized by exposure categories. Users can understand their data very clearly, with as much depth as they personally desire.

This application is the first prototype of our user portal, where users will visualize their results and understand how to breakdown their health and take positive action. We provide a dashboard for viewing chemical exposure levels, percentiles, detection rates, and longitudinal trends.

## Key Features

- **Dashboard** - Overview charts and test selection for quick insights
- **Category-based Organization** - Six main categories: Agricultural Chemicals, Household Products, Personal Care Products, Industrial Chemicals, Persistent Pollutants, Containers & Coatings
- **All Exposures Page** - Comprehensive listing with filtering by exposure level (pay-attention, monitor-only, low-exposure, not-detected)
- **Individual Chemical Detail Pages** - Deep dive into specific chemicals with longitudinal tracking
- **Test Management** - Support for multiple test dates with comparison capabilities
- **Exposure Level Classification** - Automatic categorization based on percentile rankings

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, TypeScript, Tailwind CSS
- **Visualization**: Recharts
- **Data Processing**: PapaParse for CSV parsing
- **Icons**: Lucide React, React Icons
- **Animations**: Framer Motion

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes for data processing
│   │   ├── chemicals/    # Chemical data endpoints
│   │   ├── csv-parser.ts # CSV parsing utilities
│   │   └── utils.ts      # Chemical data utilities
│   ├── dashboard/         # Main dashboard page
│   ├── categories/        # Category overview page
│   ├── exposures/         # All exposures listing page
│   ├── chemical/[name]/   # Individual chemical detail pages
│   └── tests/             # Test management page
├── components/            # React components
│   ├── category-overview/ # Category-specific components
│   └── ...                # Shared UI components
├── data/                  # Static data files
│   ├── category-overviews/# Category metadata (JSON)
│   ├── chemicals/         # Chemical reference data (JSON)
│   └── structured/        # TypeScript structured data
├── lib/                   # Utility libraries
│   ├── csv-parser-client.ts
│   ├── date-utils.ts
│   ├── colors.ts
│   └── category-icons.tsx
└── contexts/              # React contexts
    └── TestContext.tsx    # Test selection state management

public/
└── data/p1/              # CSV test data files
    └── all-chemicals_test*.csv
```

## Data Flow

- CSV files in `public/data/p1/` are parsed by [src/app/api/csv-parser.ts](src/app/api/csv-parser.ts)
- Client-side parsing via [src/lib/csv-parser-client.ts](src/lib/csv-parser-client.ts) using PapaParse
- Data flows: CSV → ChemicalData interface → Components
- Test selection managed via TestContext
- API routes provide server-side data processing endpoints

## Key Concepts

- **Chemical Categories**: Six main exposure categories organize chemicals by source/use
- **Exposure Levels**: Based on percentile rankings:
  - Pay Attention (>60th percentile)
  - Monitor Only (30-60th percentile)
  - Low Exposure (0-30th percentile)
  - Not Detected (value = 0)
- **Percentiles**: Represent where a measured value falls relative to population data
- **Test Metadata**: Each test has an ID, filename, and date for longitudinal tracking
- **Longitudinal Data**: Tracks chemical levels across multiple test dates
