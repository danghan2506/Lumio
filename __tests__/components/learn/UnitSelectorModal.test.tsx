import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { UnitSelectorModal } from '@/components/learn/UnitSelectorModal';
import type { UnitRow } from '@/types/database.types';
import type { UnitProgressSummary } from '@/lib/api';

const mockUnits: UnitRow[] = [
  {
    id: 'unit-1',
    language_id: 'en',
    order: 1,
    title: 'Unit 1: Basics & Greetings',
    description: 'Learn essential greetings and everyday phrases',
    icon_emoji: '👋',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'unit-2',
    language_id: 'en',
    order: 2,
    title: 'Unit 2: Food & Drinks',
    description: 'Order food and talk about your favorite meals',
    icon_emoji: '🍜',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'unit-3',
    language_id: 'en',
    order: 3,
    title: 'Unit 3: Travel & Directions',
    description: 'Navigate the city and ask for directions',
    icon_emoji: '✈️',
    created_at: '2026-01-01T00:00:00Z',
  },
];

const mockUnitsProgress: Record<string, UnitProgressSummary> = {
  'unit-1': {
    completedCount: 3,
    totalCount: 3,
    isCompleted: true,
    isLocked: false,
  },
  'unit-2': {
    completedCount: 1,
    totalCount: 3,
    isCompleted: false,
    isLocked: false,
  },
  'unit-3': {
    completedCount: 0,
    totalCount: 3,
    isCompleted: false,
    isLocked: true,
  },
};

describe('UnitSelectorModal', () => {
  const defaultProps = {
    visible: true,
    units: mockUnits,
    activeUnitId: 'unit-1',
    unitsProgress: mockUnitsProgress,
    onSelectUnit: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when visible is false', () => {
    const { queryByTestId } = render(
      <UnitSelectorModal {...defaultProps} visible={false} />
    );

    expect(queryByTestId('unit-option-unit-1')).toBeNull();
    expect(queryByTestId('unit-option-unit-2')).toBeNull();
    expect(queryByTestId('unit-option-unit-3')).toBeNull();
    expect(queryByTestId('unit-selector-modal')).toBeNull();
  });

  it('renders all units with title, description, emoji, and progress details', () => {
    const { getByTestId, getByText } = render(
      <UnitSelectorModal {...defaultProps} />
    );

    // Header
    expect(getByText('Select Unit')).toBeTruthy();
    expect(getByTestId('unit-selector-close-button')).toBeTruthy();

    // Unit 1
    expect(getByTestId('unit-option-unit-1')).toBeTruthy();
    expect(getByText('Unit 1: Basics & Greetings')).toBeTruthy();
    expect(getByText('Learn essential greetings and everyday phrases')).toBeTruthy();
    expect(getByText('👋')).toBeTruthy();
    expect(getByText('3 / 3 lessons')).toBeTruthy();

    // Unit 2
    expect(getByTestId('unit-option-unit-2')).toBeTruthy();
    expect(getByText('Unit 2: Food & Drinks')).toBeTruthy();
    expect(getByText('Order food and talk about your favorite meals')).toBeTruthy();
    expect(getByText('🍜')).toBeTruthy();
    expect(getByText('1 / 3 lessons')).toBeTruthy();

    // Unit 3
    expect(getByTestId('unit-option-unit-3')).toBeTruthy();
    expect(getByText('Unit 3: Travel & Directions')).toBeTruthy();
    expect(getByText('Navigate the city and ask for directions')).toBeTruthy();
    expect(getByText('✈️')).toBeTruthy();
    expect(getByText('0 / 3 lessons')).toBeTruthy();
  });

  it('triggers onSelectUnit when an unlocked unit is pressed', () => {
    const onSelectUnit = jest.fn();
    const { getByTestId } = render(
      <UnitSelectorModal {...defaultProps} onSelectUnit={onSelectUnit} />
    );

    const unit2Option = getByTestId('unit-option-unit-2');
    fireEvent.press(unit2Option);

    expect(onSelectUnit).toHaveBeenCalledTimes(1);
    expect(onSelectUnit).toHaveBeenCalledWith(mockUnits[1]);
  });

  it('does not trigger onSelectUnit when a locked unit is pressed, and displays locked indicator', () => {
    const onSelectUnit = jest.fn();
    const { getByTestId } = render(
      <UnitSelectorModal {...defaultProps} onSelectUnit={onSelectUnit} />
    );

    const unit3Option = getByTestId('unit-option-unit-3');
    expect(unit3Option.props.accessibilityState?.disabled).toBe(true);

    fireEvent.press(unit3Option);
    expect(onSelectUnit).not.toHaveBeenCalled();

    // Lock indicator exists
    expect(getByTestId('unit-lock-unit-3')).toBeTruthy();
  });

  it('marks active unit visually and in accessibilityState', () => {
    const { getByTestId } = render(
      <UnitSelectorModal {...defaultProps} activeUnitId="unit-2" />
    );

    const unit1Option = getByTestId('unit-option-unit-1');
    const unit2Option = getByTestId('unit-option-unit-2');

    expect(unit2Option.props.accessibilityState?.selected).toBe(true);
    expect(unit1Option.props.accessibilityState?.selected).toBe(false);
  });

  it('displays completed indicator when unit is completed', () => {
    const { getByTestId, queryByTestId } = render(
      <UnitSelectorModal {...defaultProps} />
    );

    // Unit 1 is completed
    expect(getByTestId('unit-completed-unit-1')).toBeTruthy();

    // Unit 2 is not completed
    expect(queryByTestId('unit-completed-unit-2')).toBeNull();
  });

  it('triggers onClose when close button is pressed', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <UnitSelectorModal {...defaultProps} onClose={onClose} />
    );

    const closeButton = getByTestId('unit-selector-close-button');
    fireEvent.press(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when backdrop is tapped', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <UnitSelectorModal {...defaultProps} onClose={onClose} />
    );

    const backdrop = getByTestId('unit-selector-backdrop');
    fireEvent.press(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles units with missing progress safely without error', () => {
    const { getByTestId, getAllByText } = render(
      <UnitSelectorModal
        {...defaultProps}
        unitsProgress={{}}
      />
    );

    expect(getByTestId('unit-option-unit-1')).toBeTruthy();
    expect(getAllByText('0 / 0 lessons')).toHaveLength(3);
  });
});
