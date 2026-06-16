import { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { I18N_KEYS } from '../../../i18n/keys';
import { useTranslation } from '../../../i18n/i18n-provider';
import { useSession } from '../../../session/session-context';
import { ScreenShell } from '../../../ui/templates/screen-shell';
import { SessionBootstrapGate } from '../../../ui/organisms/session-bootstrap-gate';
import { Spinner } from '../../../ui/atoms/spinner';
import { resolveBootstrapErrorMessage } from '../bootstrap-session.errors';
import { runSessionBootstrap } from '../bootstrap-session.service';
import { resetApiBaseUrlCache } from '../../../api/resolve-api-base-url';
import { MainTabs } from '../../../navigation/main-tabs';

function LoadingScreen() {
  return (
    <ScreenShell contentStyle={styles.centered}>
      <Spinner size="large" />
    </ScreenShell>
  );
}

export function SessionGate() {
  const { t } = useTranslation();
  const { sessionToken, isReady, setSessionTokenState } = useSession();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    resetApiBaseUrlCache();

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
    if (!isReady || sessionToken || loading || errorMessage) {
      return;
    }

    void bootstrap();
  }, [bootstrap, errorMessage, isReady, loading, sessionToken]);

  if (!isReady || (loading && !sessionToken && !errorMessage)) {
    return <LoadingScreen />;
  }

  if (!sessionToken) {
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

  return <MainTabs />;
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
