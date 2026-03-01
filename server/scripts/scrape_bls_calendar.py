"""
Scrape the BLS economic release calendar for a given month and save to JSON.
Usage: python3 scrape_bls_calendar.py [YYYY] [MM]
Defaults to current month + next month.
"""
import requests
import json
import sys
import re
from bs4 import BeautifulSoup
from datetime import datetime, timedelta

HEADERS = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}

# Priority tiers for display ordering / importance badge
PRIORITY = {
    'Employment Situation': 'high',           # NFP
    'Consumer Price Index': 'high',           # CPI
    'Producer Price Index': 'high',           # PPI
    'Real Earnings': 'medium',
    'Job Openings and Labor Turnover Survey': 'medium',  # JOLTS
    'Productivity and Costs': 'medium',
    'Employer Costs for Employee Compensation': 'medium',
    'U.S. Import and Export Price Indexes': 'low',
    'County Employment and Wages': 'low',
    'Productivity and Costs (P)': 'medium',
    'Productivity and Costs (R)': 'medium',
}

SHORTNAMES = {
    'Employment Situation': 'NFP',
    'Consumer Price Index': 'CPI',
    'Producer Price Index': 'PPI',
    'Real Earnings': 'Real Earnings',
    'Job Openings and Labor Turnover Survey': 'JOLTS',
    'Productivity and Costs': 'Productivity',
    'Productivity and Costs (P)': 'Productivity (P)',
    'Productivity and Costs (R)': 'Productivity (R)',
    'Employer Costs for Employee Compensation': 'ECI',
    'U.S. Import and Export Price Indexes': 'Import/Export Prices',
    'County Employment and Wages': 'County Employment',
}


def scrape_month(year: int, month: int) -> list:
    url = f'https://www.bls.gov/schedule/{year}/{month:02d}_sched.htm'
    try:
        res = requests.get(url, headers=HEADERS, timeout=10)
        res.raise_for_status()
    except Exception as e:
        return []

    soup = BeautifulSoup(res.text, 'html.parser')
    events = []

    # The calendar table has cells; each cell contains date + events text
    tables = soup.find_all('table')
    for table in tables:
        rows = table.find_all('tr')
        current_day = None
        for row in rows:
            cells = row.find_all('td')
            for cell in cells:
                text = cell.get_text('\n', strip=True)
                if not text:
                    continue

                lines = [l.strip() for l in text.split('\n') if l.strip()]
                if not lines:
                    continue

                # Try to extract day number from first token
                day_match = re.match(r'^(\d{1,2})$', lines[0])
                if day_match:
                    current_day = int(day_match.group(1))
                    lines = lines[1:]

                # Parse events: pattern is "Release Name\nPeriod\nTime AM/PM"
                i = 0
                while i < len(lines):
                    name = lines[i]
                    # Skip pure day numbers or month names
                    if re.match(r'^\d{1,2}$', name) or re.match(r'^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$', name):
                        i += 1
                        continue
                    # Collect period and time
                    period = lines[i + 1] if i + 1 < len(lines) else ''
                    time_str = ''
                    if i + 2 < len(lines) and re.search(r'\d{1,2}:\d{2}\s*[AP]M', lines[i + 2]):
                        time_str = lines[i + 2]
                        i += 3
                    elif re.search(r'\d{1,2}:\d{2}\s*[AP]M', period):
                        time_str = period
                        period = ''
                        i += 2
                    else:
                        i += 1
                        continue

                    if current_day and name:
                        try:
                            date = datetime(year, month, current_day)
                            iso_date = date.strftime('%Y-%m-%d')
                        except ValueError:
                            iso_date = f'{year}-{month:02d}-{current_day:02d}'

                        events.append({
                            'date': iso_date,
                            'day': current_day,
                            'name': name,
                            'shortName': SHORTNAMES.get(name, name),
                            'period': period,
                            'time': time_str,
                            'priority': PRIORITY.get(name, 'low'),
                        })

    # Deduplicate
    seen = set()
    unique = []
    for e in events:
        key = (e['date'], e['name'])
        if key not in seen:
            seen.add(key)
            unique.append(e)

    return sorted(unique, key=lambda x: x['date'])


def main():
    now = datetime.now()
    months = [(now.year, now.month)]
    # also include next month
    nxt = now.replace(day=1) + timedelta(days=32)
    months.append((nxt.year, nxt.month))

    all_events = []
    for y, m in months:
        events = scrape_month(y, m)
        all_events.extend(events)

    print(json.dumps({'success': True, 'data': all_events, 'scrapedAt': now.isoformat()}))


if __name__ == '__main__':
    main()
