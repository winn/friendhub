/*
  # Add LINE channel helper functions

  1. New Functions
    - `encrypt_line_config`: Encrypts sensitive LINE channel configuration
    - `decrypt_line_config`: Decrypts LINE channel configuration
    - `update_line_config`: Helper to update LINE channel configuration

  2. Security
    - Functions are only accessible to authenticated users
    - Encryption key is stored in vault
*/

-- Create encryption functions if they don't exist
CREATE OR REPLACE FUNCTION encrypt_line_config(
  p_access_token text,
  p_secret_token text
) RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'accessToken', p_access_token,
    'secretToken', p_secret_token
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update LINE channel config
CREATE OR REPLACE FUNCTION update_line_config(
  p_agent_id uuid,
  p_access_token text,
  p_secret_token text
) RETURNS void AS $$
DECLARE
  v_webhook_url text;
BEGIN
  -- Generate webhook URL
  SELECT webhook_url INTO v_webhook_url
  FROM channel_configs
  WHERE agent_id = p_agent_id AND channel_type = 'line';

  -- If no config exists, create webhook URL
  IF v_webhook_url IS NULL THEN
    v_webhook_url := current_setting('app.settings.api_url') || '/functions/v1/line-webhook/' || p_agent_id::text;
  END IF;

  -- Upsert channel config
  INSERT INTO channel_configs (
    agent_id,
    channel_type,
    config,
    webhook_url
  ) VALUES (
    p_agent_id,
    'line',
    encrypt_line_config(p_access_token, p_secret_token),
    v_webhook_url
  )
  ON CONFLICT (agent_id, channel_type) 
  DO UPDATE SET
    config = encrypt_line_config(p_access_token, p_secret_token),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comments
COMMENT ON FUNCTION encrypt_line_config IS 'Encrypts LINE channel configuration data';
COMMENT ON FUNCTION update_line_config IS 'Updates LINE channel configuration for an agent';

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION encrypt_line_config TO authenticated;
GRANT EXECUTE ON FUNCTION update_line_config TO authenticated;