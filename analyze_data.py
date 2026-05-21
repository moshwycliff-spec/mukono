# Mukono Survey Data Analysis Helper
# Run this in Python to analyze exported CSV data

import pandas as pd
import matplotlib.pyplot as plt
from scipy import stats

# Load data
df = pd.read_csv('mukono_survey_export.csv')

# Basic statistics
print("=== SURVEY RESPONSE SUMMARY ===")
print(f"Total responses: {len(df)}")
print(f"
Gender distribution:")
print(df['gender'].value_counts())
print(f"
School type distribution:")
print(df['school_type'].value_counts())

# Social media usage vs academic performance
print("
=== SOCIAL MEDIA vs ACADEMIC PERFORMANCE ===")

# Convert grade ranges to numeric midpoints
grade_map = {
    '80_100': 90, '70_79': 74.5, '60_69': 64.5, 
    '50_59': 54.5, 'below_50': 45
}
df['grade_numeric'] = df['mock_grade'].map(grade_map)

# Correlation
corr = df['sm_hours'].corr(df['grade_numeric'])
print(f"Correlation (SM hours vs Grade): {corr:.3f}")

# T-test: Heavy users vs Light users
heavy = df[df['sm_hours'].astype(float) > 3]['grade_numeric']
light = df[df['sm_hours'].astype(float) <= 1]['grade_numeric']
if len(heavy) > 0 and len(light) > 0:
    t_stat, p_value = stats.ttest_ind(heavy.dropna(), light.dropna())
    print(f"T-test (Heavy vs Light users): t={t_stat:.3f}, p={p_value:.3f}")

# Platform analysis
print("
=== PLATFORM USAGE ===")
platforms = ['whatsapp', 'tiktok', 'facebook', 'instagram', 'youtube', 'twitter']
for platform in platforms:
    count = df['platforms'].str.contains(platform, na=False).sum()
    pct = (count / len(df)) * 100
    print(f"{platform}: {count} ({pct:.1f}%)")

# Sleep analysis
print("
=== SLEEP PATTERNS ===")
sleep_quality_map = {'very_good': 5, 'good': 4, 'fair': 3, 'poor': 2, 'very_poor': 1}
df['sleep_score'] = df['sleep_quality'].map(sleep_quality_map)
sleep_corr = df['sm_hours'].corr(df['sleep_score'])
print(f"Correlation (SM hours vs Sleep quality): {sleep_corr:.3f}")

# Visualization
plt.figure(figsize=(10, 6))
plt.scatter(df['sm_hours'], df['grade_numeric'], alpha=0.6, color='#1a5f2a')
plt.xlabel('Social Media Hours per Day')
plt.ylabel('Academic Performance (%)')
plt.title('Social Media Use vs Academic Performance - Mukono District')
plt.grid(True, alpha=0.3)
plt.savefig('sm_vs_performance.png', dpi=300, bbox_inches='tight')
print("
Chart saved as sm_vs_performance.png")

print("
=== ANALYSIS COMPLETE ===")
