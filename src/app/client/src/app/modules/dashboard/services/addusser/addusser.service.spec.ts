import { TestBed } from '@angular/core/testing';

import { AddusserService } from './addusser.service';

describe('AddusserService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AddusserService = TestBed.get(AddusserService);
    expect(service).toBeTruthy();
  });
});
