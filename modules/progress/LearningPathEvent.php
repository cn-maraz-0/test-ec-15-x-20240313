<?php

/* ========================================================================
 * Open eClass 
 * E-learning and Course Management System
 * ========================================================================
 * Copyright 2003-2015  Greek Universities Network - GUnet
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
 * ======================================================================== 
 */

require_once 'BasicEvent.php';

class LearningPathEvent extends BasicEvent {
    
    const ACTIVITY = 'learning path';
    const UPDPROGRESS = 'learning-path-accessed';
    
    public function __construct() {
        parent::__construct();
        
        $this->on(self::UPDPROGRESS, function($data) {
            $threshold = 0;
            
            // fetch grade from DB and use it as threshold
            $grade = get_learnPath_combined_progress($data->resource, $data->uid);
            if ($grade && floatval($grade) > 0) {
                $threshold = floatval($grade);
            }
            
            $this->setEventData($data);
            $this->context['threshold'] = $threshold;
            $this->emit(parent::PREPARERULES);
        });
    }
    
}
