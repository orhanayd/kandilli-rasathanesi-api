<?php
    date_default_timezone_set('Europe/Istanbul');
    header("Access-Control-Allow-Origin: *");
    header('Content-type: application/json');

    include("funcs.php");
    $limit=10;
    $main_result = array(
        "status"=>false,
        "desc"=>"",
        "result"=>[]
    );


    if(isset($_GET['date'])){
  
        if(isset($_GET['limit'])){
            $_GET['limit'] = (int)$_GET['limit'];
            if($_GET['limit']<1){
                $limit = 10;
            }else{
                $limit = $_GET['limit'];
            }
        }
        $query = array("date_stamp"=>$_GET['date']);
        $data = checkItem($query, $limit, true);
        if(count($data)>0){
            $main_result['desc'] = "OK";
            $main_result['status'] = true;
        }else{
            $main_result['desc'] = "No result";
        }
        $main_result['result'] = $data;
    }else{
        $main_result['desc'] = "check query params";
    }



    echo json_encode($main_result);
?>