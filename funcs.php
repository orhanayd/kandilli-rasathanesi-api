<?php
    include("env.php");
    /**
     * earthquake check database
     */
    function checkItem($data, $limit=1, $return=false){
        if($limit<1){
            $limit = 1;
        }
        $manager = new MongoDB\Driver\Manager($_ENV["mongo_conn"]);
        $query = new MongoDB\Driver\Query(
            $data,
            array(
                'limit'=>$limit,
                'sort'=>array("_id"=>-1)
            )
        );
        $cursor = $manager->executeQuery('earthquake.data', $query);
        $dataMongo = $cursor->toArray();
        if($return){
            return $dataMongo;
        }
        if(count($dataMongo)>0){
            return null;
        }else{
            if(saveItem($data)){
                return true;
            }else{
                return false;
            }
        }
    }

    /**
     * save earthquake
     */
    function saveItem($data){
        $manager = new MongoDB\Driver\Manager($_ENV["mongo_conn"]);
        $bulk = new MongoDB\Driver\BulkWrite;
        $bulk->insert($data);
        return $manager->executeBulkWrite('earthquake.data', $bulk);
    }
?>