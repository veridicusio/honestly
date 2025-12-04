# Differential Privacy Guide

**Version:** 1.0  
**Last Updated:** December 4, 2024

## Overview

This guide explains how to use differential privacy (DP) in the Honestly platform to protect individual privacy while enabling useful analytics and data sharing.

---

## What is Differential Privacy?

Differential privacy is a mathematical framework that provides strong privacy guarantees by adding carefully calibrated noise to data or query results.

### Key Properties

**Privacy Guarantee:** An adversary cannot determine whether any specific individual's data was used in a computation, even with arbitrary background knowledge.

**Utility Preservation:** The noise is calibrated to maintain usefulness of aggregate results while protecting individuals.

**Composability:** Multiple queries' privacy loss can be tracked and bounded.

---

## Quick Start

### Basic Usage

```python
from vault.differential_privacy import DifferentialPrivacy

# Initialize DP service
dp = DifferentialPrivacy(epsilon=1.0, delta=1e-5)

# Private count query
true_count = 1000
noisy_count = dp.private_count(true_count)
print(f"True: {true_count}, Noisy: {noisy_count}")

# Private mean query
true_mean = 42.5
count = 100
max_value = 100.0
noisy_mean = dp.private_mean(true_mean, count, max_value)
print(f"True mean: {true_mean}, Noisy mean: {noisy_mean}")
```

---

## Core Concepts

### Privacy Parameters

#### Epsilon (ε)

**Meaning:** Privacy loss parameter. Lower = more privacy.

**Typical Values:**
- ε = 0.1: Very high privacy (large noise)
- ε = 1.0: Standard privacy (moderate noise)
- ε = 10.0: Low privacy (small noise)

**Rule of Thumb:** ε ≤ 1.0 for good privacy

```python
# High privacy
dp_high = DifferentialPrivacy(epsilon=0.1)

# Standard privacy
dp_std = DifferentialPrivacy(epsilon=1.0)

# Low privacy (more utility)
dp_low = DifferentialPrivacy(epsilon=10.0)
```

#### Delta (δ)

**Meaning:** Failure probability. The probability that the privacy guarantee doesn't hold.

**Typical Values:**
- δ = 1e-5: Standard
- δ = 1e-10: Very conservative
- δ = 0: Pure DP (no failure probability)

**Rule of Thumb:** δ should be < 1/n where n is dataset size

```python
# Standard delta
dp = DifferentialPrivacy(epsilon=1.0, delta=1e-5)

# Very conservative
dp = DifferentialPrivacy(epsilon=1.0, delta=1e-10)
```

### Sensitivity

**Definition:** Maximum change in query result when adding/removing one individual's data.

**Examples:**
- **Count query:** Sensitivity = 1 (adding one person changes count by 1)
- **Sum with max value 100:** Sensitivity = 100 (one person can contribute up to 100)
- **Average:** Need to bound contributions

```python
# Count: sensitivity = 1
noisy_count = dp.add_laplace_noise(true_count, sensitivity=1.0)

# Sum with bounded contributions
noisy_sum = dp.add_laplace_noise(true_sum, sensitivity=max_contribution)
```

---

## Privacy Mechanisms

### 1. Laplace Mechanism

**Use Case:** Numeric queries (counts, sums)

**Noise Distribution:** Laplace(scale = sensitivity / epsilon)

**Guarantee:** Pure ε-differential privacy

```python
dp = DifferentialPrivacy(epsilon=1.0)

# Count query
true_count = 500
noisy_count = dp.add_laplace_noise(
    true_value=true_count,
    sensitivity=1.0,  # Adding one person changes count by 1
    epsilon=0.5       # Use half the privacy budget
)

print(f"True: {true_count}, Noisy: {noisy_count}")
```

### 2. Gaussian Mechanism

**Use Case:** Better utility for large datasets

**Noise Distribution:** Gaussian(σ = sensitivity × sqrt(2 × ln(1.25/δ)) / ε)

**Guarantee:** (ε, δ)-differential privacy

```python
dp = DifferentialPrivacy(epsilon=1.0, delta=1e-5)

# Sum query with Gaussian noise
noisy_sum = dp.add_gaussian_noise(
    true_value=total_sum,
    sensitivity=max_contribution,
    epsilon=0.5,
    delta=1e-5
)
```

### 3. Exponential Mechanism

**Use Case:** Selecting from discrete options (e.g., top-k, recommendations)

**Mechanism:** Probabilities proportional to utility

**Guarantee:** ε-differential privacy

```python
dp = DifferentialPrivacy(epsilon=1.0)

# Select best option while preserving privacy
scores = [10.5, 15.2, 22.8, 18.3, 12.1]  # Quality scores
sensitivity = 1.0  # How much one person affects scores

selected_idx = dp.add_exponential_noise(
    scores=scores,
    sensitivity=sensitivity,
    epsilon=0.5
)

print(f"Selected option: {selected_idx}")
```

---

## Common Use Cases

### Use Case 1: Private Statistics

```python
from vault.differential_privacy import DifferentialPrivacy

# Initialize DP
dp = DifferentialPrivacy(epsilon=1.0)

# Database statistics
total_users = 10000
average_age = 35.2
total_revenue = 1500000.0

# Release private statistics
noisy_users = dp.private_count(total_users)
noisy_age = dp.private_mean(
    true_mean=average_age,
    count=total_users,
    max_value=120.0  # Maximum possible age
)
noisy_revenue = dp.private_sum(
    true_sum=total_revenue,
    max_value=10000.0,  # Max contribution per user
    epsilon=0.3
)

# Publish results
print(f"Total users: {noisy_users}")
print(f"Average age: {noisy_age:.1f}")
print(f"Total revenue: ${noisy_revenue:,.2f}")
```

### Use Case 2: Private Analytics Dashboard

```python
class PrivateAnalytics:
    def __init__(self, epsilon=1.0):
        self.dp = DifferentialPrivacy(epsilon=epsilon, delta=1e-5)
    
    def get_user_count_by_country(self, country_counts):
        """Return private counts by country."""
        return {
            country: self.dp.private_count(count)
            for country, count in country_counts.items()
        }
    
    def get_average_session_duration(self, durations, max_duration=3600):
        """Return private average session duration."""
        true_mean = sum(durations) / len(durations)
        return self.dp.private_mean(
            true_mean=true_mean,
            count=len(durations),
            max_value=max_duration
        )

# Usage
analytics = PrivateAnalytics(epsilon=1.0)
noisy_counts = analytics.get_user_count_by_country({
    'US': 5000,
    'UK': 2000,
    'DE': 1500
})
```

### Use Case 3: Private Data Sharing

```python
def share_aggregate_data(user_data, epsilon=1.0):
    """
    Share aggregate statistics with privacy guarantees.
    
    Args:
        user_data: List of user records
        epsilon: Privacy budget
    """
    dp = DifferentialPrivacy(epsilon=epsilon)
    
    # Compute true statistics
    total = len(user_data)
    avg_value = sum(u['value'] for u in user_data) / total
    
    # Add noise for privacy
    noisy_total = dp.private_count(total, epsilon=epsilon/2)
    noisy_avg = dp.private_mean(
        true_mean=avg_value,
        count=total,
        max_value=1000.0,
        epsilon=epsilon/2
    )
    
    return {
        'total_users': noisy_total,
        'average_value': noisy_avg,
        'privacy_guarantee': f'ε={epsilon}'
    }
```

---

## Privacy Budget Management

### Tracking Budget

```python
dp = DifferentialPrivacy(epsilon=1.0)

# Perform queries
dp.add_laplace_noise(100, sensitivity=1.0, epsilon=0.3)
dp.add_laplace_noise(200, sensitivity=1.0, epsilon=0.4)

# Check budget status
status = dp.get_privacy_budget_status()
print(f"Total budget: {status['epsilon']}")
print(f"Spent: {status['spent']}")
print(f"Remaining: {status['remaining']}")
print(f"Exhausted: {status['exhausted']}")
```

### Budget Composition

**Sequential Composition:** Running k queries with ε₁, ε₂, ..., εₖ gives total privacy loss of ε = ε₁ + ε₂ + ... + εₖ

```python
# Allocate budget across queries
total_epsilon = 1.0

# Query 1: 30% of budget
query1 = dp.private_count(count1, epsilon=0.3)

# Query 2: 40% of budget
query2 = dp.private_sum(sum2, max_value=100, epsilon=0.4)

# Query 3: 30% of budget
query3 = dp.private_mean(mean3, count=100, max_value=100, epsilon=0.3)

# Total privacy loss: 0.3 + 0.4 + 0.3 = 1.0
```

### Budget Reset

**Warning:** Resetting budget can compromise privacy if not done carefully!

```python
# Only reset in appropriate circumstances:
# - New time period (e.g., monthly reports)
# - Different dataset
# - User consent for new analysis

dp.reset_privacy_budget(new_epsilon=1.0)
```

---

## Best Practices

### 1. Choose Appropriate Epsilon

```python
# High privacy for sensitive data
dp_sensitive = DifferentialPrivacy(epsilon=0.1)  # Health, financial data

# Standard privacy for general data
dp_standard = DifferentialPrivacy(epsilon=1.0)   # User counts, aggregates

# Lower privacy when utility is critical
dp_utility = DifferentialPrivacy(epsilon=5.0)    # Non-sensitive analytics
```

### 2. Bound Sensitivity

```python
# Always bound contributions
MAX_AGE = 120
MAX_INCOME = 1000000

# Good: Bounded sensitivity
def private_average_income(incomes, epsilon=1.0):
    # Clip incomes to max
    clipped = [min(inc, MAX_INCOME) for inc in incomes]
    true_mean = sum(clipped) / len(clipped)
    
    dp = DifferentialPrivacy(epsilon=epsilon)
    return dp.private_mean(
        true_mean=true_mean,
        count=len(clipped),
        max_value=MAX_INCOME
    )
```

### 3. Pre-Aggregate When Possible

```python
# Less efficient: Add noise to each record
for record in records:
    noisy_value = dp.add_laplace_noise(record['value'], sensitivity=1.0)

# Better: Aggregate first, then add noise once
total = sum(r['value'] for r in records)
noisy_total = dp.add_laplace_noise(total, sensitivity=MAX_VALUE)
```

### 4. Monitor Budget Usage

```python
class BudgetMonitor:
    def __init__(self, epsilon, alert_threshold=0.8):
        self.dp = DifferentialPrivacy(epsilon=epsilon)
        self.alert_threshold = alert_threshold
        self.epsilon = epsilon
    
    def query_with_alert(self, query_func, epsilon_cost):
        if self.dp.budget.spent + epsilon_cost > self.epsilon * self.alert_threshold:
            print(f"⚠️ Privacy budget alert: {self.dp.budget.spent + epsilon_cost}/{self.epsilon}")
        
        result = query_func(epsilon=epsilon_cost)
        return result
```

---

## Testing Privacy

### Running Tests

```bash
cd backend-python
python -m pytest tests/test_differential_privacy.py -v
```

### Test Coverage

- ✅ Privacy budget tracking
- ✅ Laplace mechanism
- ✅ Gaussian mechanism
- ✅ Exponential mechanism
- ✅ Private count, sum, mean
- ✅ Edge cases (small epsilon, large sensitivity)
- ✅ Attack scenarios
- ✅ Privacy budget exhaustion

### Verify Privacy in Practice

```python
def test_privacy_empirically():
    """
    Empirical test: Result shouldn't change much with one record added/removed.
    """
    dp = DifferentialPrivacy(epsilon=1.0)
    
    # Dataset without one record
    dataset1 = [1, 2, 3, 4, 5]
    count1 = len(dataset1)
    
    # Dataset with one additional record
    dataset2 = [1, 2, 3, 4, 5, 6]
    count2 = len(dataset2)
    
    # Get noisy counts multiple times
    results1 = [dp.private_count(count1) for _ in range(100)]
    results2 = [dp.private_count(count2) for _ in range(100)]
    
    # Distributions should overlap significantly
    import statistics
    mean1 = statistics.mean(results1)
    mean2 = statistics.mean(results2)
    
    print(f"Mean noisy count (dataset1): {mean1}")
    print(f"Mean noisy count (dataset2): {mean2}")
    print(f"Difference: {abs(mean2 - mean1)}")
```

---

## Advanced Topics

### Sparse Vector Technique

For answering many queries with limited budget:

```python
def sparse_vector(queries, threshold, epsilon, max_results):
    """
    Answer queries until max_results exceed threshold.
    Uses only O(log(max_results)) privacy budget.
    """
    dp = DifferentialPrivacy(epsilon=epsilon)
    
    # Add noise to threshold
    noisy_threshold = dp.add_laplace_noise(
        threshold,
        sensitivity=1.0,
        epsilon=epsilon/2
    )
    
    results = []
    for i, query_value in enumerate(queries):
        # Add noise to query
        noisy_value = dp.add_laplace_noise(
            query_value,
            sensitivity=1.0,
            epsilon=epsilon/(2*max_results)
        )
        
        if noisy_value >= noisy_threshold:
            results.append(i)
            if len(results) >= max_results:
                break
    
    return results
```

### Local Differential Privacy

Each user adds noise before sending data:

```python
def local_dp_report(true_value, epsilon=1.0):
    """
    User adds noise locally before sending to server.
    Provides privacy even if server is untrusted.
    """
    dp = DifferentialPrivacy(epsilon=epsilon)
    noisy_value = dp.add_laplace_noise(true_value, sensitivity=1.0)
    return noisy_value

# Each user
user_reports = [
    local_dp_report(user1_value, epsilon=1.0),
    local_dp_report(user2_value, epsilon=1.0),
    # ...
]

# Server computes average (no additional noise needed)
server_average = sum(user_reports) / len(user_reports)
```

---

## Common Pitfalls

### ❌ Don't: Release Too Many Queries

```python
# Bad: Exhausts privacy budget quickly
for i in range(1000):
    result = dp.private_count(counts[i], epsilon=0.01)
# Total privacy loss: 1000 × 0.01 = 10 (very high!)
```

### ✅ Do: Pre-aggregate

```python
# Good: Single query
total_count = sum(counts)
noisy_total = dp.private_count(total_count, epsilon=1.0)
```

### ❌ Don't: Forget to Bound Sensitivity

```python
# Bad: Unbounded income
avg_income = sum(incomes) / len(incomes)
noisy_avg = dp.private_mean(avg_income, len(incomes), max_value=???)
```

### ✅ Do: Clip Values

```python
# Good: Clip to reasonable maximum
MAX_INCOME = 1_000_000
clipped_incomes = [min(inc, MAX_INCOME) for inc in incomes]
avg = sum(clipped_incomes) / len(clipped_incomes)
noisy_avg = dp.private_mean(avg, len(clipped_incomes), max_value=MAX_INCOME)
```

---

## Real-World Applications

### Case Study: Census Bureau

The US Census uses differential privacy with ε ≈ 2-6 for 2020 census data release.

**Trade-offs:**
- Strong privacy protection
- Some accuracy loss in small areas
- Overall national statistics remain accurate

### Case Study: Apple

Apple uses local differential privacy (ε ≈ 2-10) for:
- Emoji usage statistics
- Safari crash reports
- QuickType suggestions

**Implementation:**
- Each device adds noise
- Aggregate patterns emerge
- Individual usage stays private

### Case Study: Google

Google uses differential privacy for:
- Google Maps traffic data (ε ≈ 1)
- Android usage statistics
- Web browsing patterns

---

## Compliance

### GDPR Article 32

Differential privacy helps meet:
- Pseudonymization requirement
- Security of processing
- Protection against unauthorized access

### CCPA

DP helps demonstrate:
- De-identification of data
- Aggregate data release
- Privacy-preserving analytics

---

## Resources

### Papers

1. Dwork, C., & Roth, A. (2014). *The Algorithmic Foundations of Differential Privacy*
2. Dwork, C. (2006). *Differential Privacy*
3. McSherry, F., & Talwar, K. (2007). *Mechanism Design via Differential Privacy*

### Tools

- Google's Differential Privacy Library
- Microsoft's SmartNoise
- OpenDP

### Further Reading

- [Encryption Security Standards](encryption-security-standards.md)
- [GDPR Compliance Checklist](gdpr-compliance-checklist.md)
- Implementation: `backend-python/vault/differential_privacy.py`
- Tests: `backend-python/tests/test_differential_privacy.py`

---

## FAQ

**Q: How much noise is added?**
A: Depends on sensitivity and epsilon. Lower epsilon = more noise.

**Q: Does DP guarantee absolute privacy?**
A: No, but it provides mathematically provable bounds on privacy loss.

**Q: Can I reverse engineer individual data?**
A: With proper ε and sufficient noise, it's computationally infeasible.

**Q: What's a good epsilon value?**
A: ≤ 1.0 for good privacy. Lower for sensitive data.

**Q: How do I choose between Laplace and Gaussian?**
A: Laplace for pure-DP, Gaussian for better utility with large datasets.

**Q: Does DP work with small datasets?**
A: Yes, but noise may overwhelm signal. Larger datasets give better utility.

---

## Support

For questions or issues:
- Run tests: `pytest tests/test_differential_privacy.py -v`
- Review implementation: `vault/differential_privacy.py`
- Check documentation: This guide
- Contact: Privacy team or open GitHub issue
