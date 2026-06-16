import { useCallback, useEffect, useState } from 'react';
import { I18N_KEYS } from '../../../i18n/keys';
import { useTranslation } from '../../../i18n/i18n-provider';
import { useSession } from '../../../session/session-context';
import { ScreenShell } from '../../../ui/templates/screen-shell';
import { SessionBootstrapGate } from '../../../ui/organisms/session-bootstrap-gate';
import { resolveBootstrapErrorMessage } from '../bootstrap-session.errors';
import { runSessionBootstrap } from '../bootstrap-session.service';

export function SessionBootstrapScreen() {
  const { t } = useTranslation();
  const { setSessionTokenState } = useSession();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const token = await runSessionBootstrap();
      setSessionTokenState(token);
    } catch (error) {
      setErrorMessage(resolveBootstrapErrorMessage(error, t));
    } finally {
      setLoading(false);
    }
  }, [setSessionTokenState, t]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <ScreenShell>
      <SessionBootstrapGate
        loading={loading}
        errorMessage={errorMessage}
        loadingLabel={t(I18N_KEYS.bootstrap.loading)}
        retryLabel={t(I18N_KEYS.bootstrap.retry)}
        onRetry={() => {
          void bootstrap();
        }}
      />
    </ScreenShell>
  );
}
