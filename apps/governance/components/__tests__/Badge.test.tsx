import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RiskBadge, DecisionBadge, SeverityBadge } from '@/components/shared/Badge';

describe('Badges', () => {
  it('renders a risk tier', () => {
    render(<RiskBadge tier="HIGH" />);
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });
  it('renders a decision with spaces', () => {
    render(<DecisionBadge decision="REQUIRE_CONFIRMATION" />);
    expect(screen.getByText('REQUIRE CONFIRMATION')).toBeInTheDocument();
  });
  it('renders a severity', () => {
    render(<SeverityBadge severity="critical" />);
    expect(screen.getByText('critical')).toBeInTheDocument();
  });
});
