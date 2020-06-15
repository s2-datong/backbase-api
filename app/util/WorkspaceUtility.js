const { ApplicationError } = require("../exceptions");

class WorkspaceUtility{

    VerifyWorkspaceIsNotReadOnly(){
        // a workspace scheduled for deletion is in read only mode
        if(this.workspace 
            && this.workspace.scheduled_for_deletion
            && this.workspace.scheduled_for_deletion === true){
                throw new ApplicationError("This workspace has been scheduled for deletion and is in READ ONLY mode. This means you can't ADD, UPDATE or DELETE any channels (or other Business Objects) in this workspace");
            }
    }

    VerifyWorkspaceIsNotLocked(){
        if(this.workspace 
            && this.workspace.locked
            && this.workspace.locked === true){
                throw new ApplicationError("This workspace has been locked by an ADMIN and is in READ ONLY mode. This means you can't ADD, UPDATE or DELETE any channels (or other Business Objects) in this workspace");
            }
    }

    VerifyChannelIsNotLocked(){
        if(this.channel 
            && this.channel.locked
            && this.channel.locked === true){
                throw new ApplicationError("This channel has been locked by an ADMIN and is in READ ONLY mode. This means you can't ADD, UPDATE or DELETE any rules in this channel");
            }
    }

    VerifyRuleIsNotLocked(){
        if(this.rule 
            && this.rule.locked
            && this.rule.locked === true){
                throw new ApplicationError("This rule has been locked by an ADMIN of this Workspace and is in READ ONLY mode. This means you can't EDIT or DELETE this rule until it is unlocked");
            }
    }

    VerifyFunctionIsNotLocked(){
        if(this.function 
            && this.function.locked
            && this.function.locked === true){
                throw new ApplicationError("This function has been locked by an ADMIN of this Workspace and is in READ ONLY mode. This means you can't EDIT or DELETE this function until it is unlocked");
            }
    }

    VerifyVariableIsNotLocked(){
        if(this.variable 
            && this.variable.locked
            && this.variable.locked === true){
                throw new ApplicationError("This variable has been locked by an ADMIN of this Workspace and is in READ ONLY mode. This means you can't EDIT or DELETE this variable until it is unlocked");
            }
    }

    VerifyPollingJobIsNotLocked(){
        if(this.polling_job 
            && this.polling_job.locked
            && this.polling_job.locked === true){
                throw new ApplicationError("This Polling Job has been locked by an ADMIN of this Workspace and is in READ ONLY mode. This means you can't EDIT or DELETE this Polling Job until it is unlocked");
            }
    }

}

module.exports = WorkspaceUtility;