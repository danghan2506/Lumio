import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VocabularyFilterBar } from '@/components/vocabulary/VocabularyFilterBar';

describe('VocabularyFilterBar', () => {
  it('triggers onSearchChange and onFilterChange', () => {
    const onSearchChange = jest.fn();
    const onFilterChange = jest.fn();

    const { getByPlaceholderText, getByText } = render(
      <VocabularyFilterBar
        searchQuery=""
        onSearchChange={onSearchChange}
        activeFilter="all"
        onFilterChange={onFilterChange}
        counts={{ all: 50, due: 12, learning: 20, mastered: 18 }}
      />
    );

    const input = getByPlaceholderText('Search words or translations...');
    fireEvent.changeText(input, 'Hello');
    expect(onSearchChange).toHaveBeenCalledWith('Hello');

    const dueChip = getByText('Due (12)');
    fireEvent.press(dueChip);
    expect(onFilterChange).toHaveBeenCalledWith('due');
  });
});
