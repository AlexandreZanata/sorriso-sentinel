import { describe, expect, it } from 'vitest';
import { ContentPolicyService } from './content-policy.service.js';

describe('ContentPolicyService', () => {
  const policy = ContentPolicyService.default();

  it('should_reject_comment_containing_cpf_pattern', () => {
    const result = policy.validateUserText('Denuncia: CPF 123.456.789-00');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.reason).toBe('cpf');
    }
  });

  it('should_reject_comment_containing_phone_pattern', () => {
    const result = policy.validateUserText('Ligue (11) 98765-4321');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.reason).toBe('phone');
    }
  });

  it('should_reject_comment_containing_license_plate_pattern', () => {
    expect(policy.validateUserText('Carro placa ABC-1234 fugiu').ok).toBe(false);
    expect(policy.validateUserText('Veiculo ABC1D23 estacionado').ok).toBe(false);
  });

  it('should_accept_neutral_comment_text', () => {
    const result = policy.validateUserText(
      'Buraco grande na esquina, cuidado com motos.',
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('Buraco grande na esquina, cuidado com motos.');
    }
  });

  it('should_reject_pseudonym_that_is_a_full_name', () => {
    const result = policy.validatePseudonym('João Silva');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.reason).toBe('full_name');
    }
  });
});
