<?php

/* ========================================================================
 * Open eClass 3.0
 * E-learning and Course Management System
 * ========================================================================
 * Copyright 2003-2013  Greek Universities Network - GUnet
 * A full copyright notice can be read in "/info/copyright.txt".
 * For a full list of contributors, see "credits.txt".
 *
 * Open eClass is an open platform distributed in the hope that it will
 * be useful (without any warranty), under the terms of the GNU (General
 * Public License) as published by the Free Software Foundation.
 * The full license can be read in "/info/license/license_gpl.txt".
 *
 * Contact address: GUnet Asynchronous eLearning Group,
 *                  Network Operations Center, University of Athens,
 *                  Panepistimiopolis Ilissia, 15784, Athens, Greece
 *                  e-mail: info@openeclass.org
 * ======================================================================== */


// Check if user is administrator and if yes continue
// Othewise exit with appropriate message
$require_admin = true;
require_once '../../include/baseTheme.php';
require_once 'modules/auth/auth.inc.php';
require_once 'modules/admin/extconfig/externals.php';
require_once 'modules/admin/extconfig/secondfaapp.php';
$nameTools = $langSFAadd;
$navigation[] = array('url' => 'index.php', 'name' => $langAdmin);
$navigation[] = array('url' => 'extapp.php', 'name' => $langExtAppConfig);

$available_themes = active_subdirs("$webDir/template", 'theme.html');

// Scan the connectors directory and locate the appropriate classes
$connectorClasses = secondfaApp::getsecondfaServices();
if (isset($_POST['submit'])) {
    if (!isset($_POST['token']) || !validate_csrf_token($_POST['token'])) csrf_token_error();
    set_config('secondfa_connector', $_POST['formconnector']);
    foreach($connectorClasses as $curConnectorClass) {
        $connector = new $curConnectorClass();
        foreach($connector->getConfigFields() as $curField => $curLabel) {
            set_config($curField, preg_replace('/[^A-Za-z0-9-.\/]/', '', $_POST['form'.$curField]));
        }
    }

    // Display result message
    $tool_content .= "<div class='alert alert-success'>$langsecondfaUpdated</div>";
} // end of if($submit)
else {
    $tool_content .= action_bar([
        [ 'title' => $langBack,
          'url' => "extapp.php",
          'icon' => 'fa-reply',
          'level' => 'primary-label' ]]);

    $connectorOptions = array_map(function($connectorClass) {
        $connector = new $connectorClass();
        $selected = q(get_config('asecondfa_connector')) == $connectorClass ? " selected='selected'" : '';
        return "<option value='$connectorClass'$selected>".$connector->getName()."</option>";
    }, $connectorClasses);

    $tool_content .= "
      <form action='$_SERVER[SCRIPT_NAME]' method='post'>
        <fieldset>
          <legend>$langBasicCfgSetting</legend>
          <div class='form-group'>
            <label class='col-sm-2'>$langSFAConf</label>
            <div class='col-sm-10'>
              <select name='formconnector'>" . implode('', $connectorOptions) . "</select>
            </div>
          </div>";
    foreach($connectorClasses as $curConnectorClass) {
        $connector = new $curConnectorClass();
        foreach($connector->getConfigFields() as $curField => $curLabel) {
            $tool_content .= "
          <div class='form-group connector-config connector-$curConnectorClass' style='display: none;'>
            <label class='col-sm-2'>$curLabel</label>
            <div class='col-sm-10'>
              <input class='FormData_InputText' type='text' name='form$curField' size='40' value='" . q(get_config($curField)) . "'>
            </div>
          </div>";
        }
    }

    $tool_content .= "
        </fieldset>
        <hr>
        <p>$langSFAusage</p>
        <ul>
          <li><a href='https://www.authy.com/'>Authy for iOS, Android, Chrome, OS X</a></li>
          <li><a href='https://fedorahosted.org/freeotp/'>FreeOTP for iOS, Android and Peeble</a></li>
          <li><a href='https://www.toopher.com/'>FreeOTP for iOS, Android and Peeble</a></li>
          <li><a href='http://itunes.apple.com/us/app/google-authenticator/id388497605?mt=8%22'>Google Authenticator for iOS</a></li>
          <li><a href='https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2%22'>Google Authenticator for Android</a></li>
          <li><a href='https://m.google.com/authenticator%22'>Google Authenticator for Blackberry</a></li>
          <li><a href='http://apps.microsoft.com/windows/en-us/app/google-authenticator/7ea6de74-dddb-47df-92cb-40afac4d38bb%22'>Google Authenticator (port) on Windows app store</a></li>
        </ul>
        <br>
        <input class='btn btn-primary' type='submit' name='submit' value='$langSubmit'>
        <a href='extapp.php' class='btn btn-default'>$langCancel</a>" .
        generate_csrf_token_form_field() . "
      </form>
      <script>
        function update_connector_config_visibility() {
            $('tr.connector-config').hide();
            $('tr.connector-config input').removeAttr('required');
            $('tr.connector-'+$('select[name=\"formconnector\"]').val()).show();
            $('tr.connector-'+$('select[name=\"formconnector\"]').val()+' input').attr('required', 'required');
        }
        $(document).ready(function() {
            $('select[name=\"formconnector\"]').change(function() {
                update_connector_config_visibility();
            });
            update_connector_config_visibility();
        });
      </script>";
}

draw($tool_content, 3, null, $head_content);
