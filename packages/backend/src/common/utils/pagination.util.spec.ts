import { describe, it, expect } from 'bun:test';
import { parsePagination, buildPaginationResponse } from './pagination.util';

describe('parsePagination', () => {
  it('기본값: page=undefined, limit=undefined → page=1, limit=20, skip=0', () => {
    const result = parsePagination();
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.skip).toBe(0);
    expect(result.take).toBe(20);
  });

  it('page=2, limit=10 → skip=10, take=10', () => {
    const result = parsePagination(2, 10);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.skip).toBe(10);
    expect(result.take).toBe(10);
  });

  it('page=3, limit=5 → skip=10', () => {
    const result = parsePagination(3, 5);
    expect(result.skip).toBe(10);
  });

  it('page=0 → page=1으로 보정', () => {
    const result = parsePagination(0, 10);
    expect(result.page).toBe(1);
    expect(result.skip).toBe(0);
  });

  it('page 음수 → page=1으로 보정', () => {
    const result = parsePagination(-5, 10);
    expect(result.page).toBe(1);
    expect(result.skip).toBe(0);
  });

  it('limit=0 → limit=20으로 보정', () => {
    const result = parsePagination(1, 0);
    expect(result.limit).toBe(20);
    expect(result.take).toBe(20);
  });

  it('limit 음수 → limit=20으로 보정', () => {
    const result = parsePagination(1, -10);
    expect(result.limit).toBe(20);
  });

  it('page=null → page=1으로 보정', () => {
    const result = parsePagination(null, null);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });
});

describe('buildPaginationResponse', () => {
  it('data와 pagination을 올바르게 조립한다', () => {
    const data = [{ id: '1' }, { id: '2' }];
    const result = buildPaginationResponse(data, 45, 3, 20);
    expect(result.data).toBe(data);
    expect(result.pagination.page).toBe(3);
    expect(result.pagination.limit).toBe(20);
    expect(result.pagination.total).toBe(45);
    expect(result.pagination.totalPages).toBe(3);
  });

  it('총 45건, limit=20 → totalPages=3', () => {
    const result = buildPaginationResponse([], 45, 1, 20);
    expect(result.pagination.totalPages).toBe(3);
  });

  it('총 20건, limit=20 → totalPages=1', () => {
    const result = buildPaginationResponse([], 20, 1, 20);
    expect(result.pagination.totalPages).toBe(1);
  });

  it('총 21건, limit=20 → totalPages=2', () => {
    const result = buildPaginationResponse([], 21, 1, 20);
    expect(result.pagination.totalPages).toBe(2);
  });

  it('total=0 → totalPages=0', () => {
    const result = buildPaginationResponse([], 0, 1, 20);
    expect(result.pagination.totalPages).toBe(0);
  });

  it('data 배열이 그대로 포함된다', () => {
    const data = ['a', 'b', 'c'];
    const result = buildPaginationResponse(data, 3, 1, 20);
    expect(result.data).toEqual(['a', 'b', 'c']);
  });
});
