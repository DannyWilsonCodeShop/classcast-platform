# DemoProject Cognito User Management Script
# This script helps manage users and groups in the Cognito User Pool

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "help",
    
    [Parameter(Mandatory=$false)]
    [string]$Username = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Email = "",
    
    [Parameter(Mandatory=$false)]
    [string]$FirstName = "",
    
    [Parameter(Mandatory=$false)]
    [string]$LastName = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Role = "student",
    
    [Parameter(Mandatory=$false)]
    [string]$Department = "",
    
    [Parameter(Mandatory=$false)]
    [string]$StudentId = "",
    
    [Parameter(Mandatory=$false)]
    [string]$InstructorId = "",
    
    [Parameter(Mandatory=$false)]
    [string]$GroupName = "",
    
    [Parameter(Mandatory=$false)]
    [string]$UserPoolId = "",
    
    [Parameter(Mandatory=$false)]
    [string]$ClientId = ""
)

function Show-Help {
    Write-Host "`nDemoProject Cognito User Management Script"
    Write-Host "========================================="
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\manage-users.ps1 -Action <action> [parameters]"
    Write-Host ""
    Write-Host "Actions:"
    Write-Host "  create-user     - Create a new user"
    Write-Host "  create-student  - Create a student user"
    Write-Host "  create-instructor - Create an instructor user"
    Write-Host "  add-to-group    - Add user to a group"
    Write-Host "  remove-from-group - Remove user from a group"
    Write-Host "  list-users      - List all users"
    Write-Host "  list-groups     - List all groups"
    Write-Host "  list-users-in-group - List users in a specific group"
    Write-Host "  delete-user     - Delete a user"
    Write-Host "  enable-user     - Enable a user"
    Write-Host "  disable-user    - Disable a user"
    Write-Host "  reset-password  - Reset user password"
    Write-Host "  help            - Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\manage-users.ps1 -Action create-student -Username john.doe -Email john@example.com -FirstName John -LastName Doe -Department ComputerScience -StudentId CS001"
    Write-Host "  .\manage-users.ps1 -Action create-instructor -Username prof.smith -Email prof@example.com -FirstName Jane -LastName Smith -Department Mathematics -InstructorId MATH001"
    Write-Host "  .\manage-users.ps1 -Action add-to-group -Username john.doe -GroupName students"
    Write-Host "  .\manage-users.ps1 -Action list-users-in-group -GroupName students"
    Write-Host ""
    Write-Host "Required Parameters:"
    Write-Host "  -UserPoolId: Your Cognito User Pool ID"
    Write-Host "  -ClientId: Your Cognito User Pool Client ID"
    Write-Host ""
    Write-Host "Note: Make sure you have AWS CLI configured and appropriate permissions."
}

function Create-User {
    param(
        [string]$Username,
        [string]$Email,
        [string]$FirstName,
        [string]$LastName,
        [string]$Role,
        [string]$Department = "",
        [string]$StudentId = "",
        [string]$InstructorId = ""
    )
    
    try {
        Write-Host "Creating user: $Username"
        
        # Create user attributes
        $attributes = @(
            "Name=email,Value=$Email",
            "Name=given_name,Value=$FirstName",
            "Name=family_name,Value=$LastName",
            "Name=custom:role,Value=$Role"
        )
        
        if ($Department) {
            $attributes += "Name=custom:department,Value=$Department"
        }
        
        if ($StudentId -and $Role -eq "student") {
            $attributes += "Name=custom:studentId,Value=$StudentId"
        }
        
        if ($InstructorId -and $Role -eq "instructor") {
            $attributes += "Name=custom:instructorId,Value=$InstructorId"
        }
        
        # Create user
        $createUserCmd = "aws cognito-idp admin-create-user --user-pool-id $UserPoolId --username $Username --user-attributes $($attributes -join ' ')"
        Write-Host "Executing: $createUserCmd"
        
        $result = Invoke-Expression $createUserCmd
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "User created successfully!"
            
            # Add user to appropriate group
            $groupName = if ($Role -eq "instructor") { "instructors" } else { "students" }
            Add-UserToGroup -Username $Username -GroupName $groupName
            
            return $true
        } else {
            Write-Host "Failed to create user"
            return $false
        }
    }
    catch {
        Write-Host "Error creating user"
        return $false
    }
}

function Create-Student {
    param(
        [string]$Username,
        [string]$Email,
        [string]$FirstName,
        [string]$LastName,
        [string]$Department,
        [string]$StudentId
    )
    
    if (-not $StudentId) {
        Write-Host "Student ID is required for student users"
        return $false
    }
    
    return Create-User -Username $Username -Email $Email -FirstName $FirstName -LastName $LastName -Role "student" -Department $Department -StudentId $StudentId
}

function Create-Instructor {
    param(
        [string]$Username,
        [string]$Email,
        [string]$FirstName,
        [string]$LastName,
        [string]$Department,
        [string]$InstructorId
    )
    
    if (-not $InstructorId) {
        Write-Host "Instructor ID is required for instructor users"
        return $false
    }
    
    return Create-User -Username $Username -Email $Email -FirstName $FirstName -LastName $LastName -Role "instructor" -Department $Department -InstructorId $InstructorId
}

function Add-UserToGroup {
    param(
        [string]$Username,
        [string]$GroupName
    )
    
    try {
        Write-Host "Adding user $Username to group $GroupName"
        
        $cmd = "aws cognito-idp admin-add-user-to-group --user-pool-id $UserPoolId --username $Username --group-name $GroupName"
        $result = Invoke-Expression $cmd
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "User added to group successfully!"
            return $true
        } else {
            Write-Host "Failed to add user to group"
            return $false
        }
    }
    catch {
        Write-Host "Error adding user to group"
        return $false
    }
}

function Remove-UserFromGroup {
    param(
        [string]$Username,
        [string]$GroupName
    )
    
    try {
        Write-Host "Removing user $Username from group $GroupName"
        
        $cmd = "aws cognito-idp admin-remove-user-from-group --user-pool-id $UserPoolId --username $Username --group-name $GroupName"
        $result = Invoke-Expression $cmd
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "User removed from group successfully!"
            return $true
        } else {
            Write-Host "Failed to remove user from group"
            return $false
        }
    }
    catch {
        Write-Host "Error removing user from group"
        return $false
    }
}

function List-Users {
    try {
        Write-Host "Listing all users..."
        
        $cmd = "aws cognito-idp list-users --user-pool-id $UserPoolId"
        $result = Invoke-Expression $cmd
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Users listed successfully"
        } else {
            Write-Host "Failed to list users"
        }
    }
    catch {
        Write-Host "Error listing users"
    }
}

function List-Groups {
    try {
        Write-Host "Listing all groups..."
        
        $cmd = "aws cognito-idp list-groups --user-pool-id $UserPoolId"
        $result = Invoke-Expression $cmd
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Groups listed successfully"
        } else {
            Write-Host "Failed to list groups"
        }
    }
    catch {
        Write-Host "Error listing groups"
    }
}

function List-UsersInGroup {
    param(
        [string]$GroupName
    )
    
    try {
        Write-Host "Listing users in group: $GroupName"
        
        $cmd = "aws cognito-idp list-users-in-group --user-pool-id $UserPoolId --group-name $GroupName"
        $result = Invoke-Expression $cmd
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Users in group listed successfully"
        } else {
            Write-Host "Failed to list users in group"
        }
    }
    catch {
        Write-Host "Error listing users in group"
    }
}

function Delete-User {
    param(
        [string]$Username
    )
    
    try {
        Write-Host "Deleting user: $Username"
        
        $cmd = "aws cognito-idp admin-delete-user --user-pool-id $UserPoolId --username $Username"
        $result = Invoke-Expression $cmd
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "User deleted successfully!"
            return $true
        } else {
            Write-Host "Failed to delete user"
            return $false
        }
    }
    catch {
        Write-Host "Error deleting user"
        return $false
    }
}

function Enable-User {
    param(
        [string]$Username
    )
    
    try {
        Write-Host "Enabling user: $Username"
        
        $cmd = "aws cognito-idp admin-enable-user --user-pool-id $UserPoolId --username $Username"
        $result = Invoke-Expression $cmd
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "User enabled successfully!"
            return $true
        } else {
            Write-Host "Failed to enable user"
            return $false
        }
    }
    catch {
        Write-Host "Error enabling user"
        return $false
    }
}

function Disable-User {
    param(
        [string]$Username
    )
    
    try {
        Write-Host "Disabling user: $Username"
        
        $cmd = "aws cognito-idp admin-disable-user --user-pool-id $UserPoolId --username $Username"
        $result = Invoke-Expression $cmd
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "User disabled successfully!"
            return $true
        } else {
            Write-Host "Failed to disable user"
            return $false
        }
    }
    catch {
        Write-Host "Error disabling user"
        return $false
    }
}

function Reset-UserPassword {
    param(
        [string]$Username
    )
    
    try {
        Write-Host "Resetting password for user: $Username"
        
        $cmd = "aws cognito-idp admin-set-user-password --user-pool-id $UserPoolId --username $Username --password 'TempPass123!' --permanent false"
        $result = Invoke-Expression $cmd
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Password reset successfully! Temporary password: TempPass123!"
            Write-Host "User must change password on next login"
            return $true
        } else {
            Write-Host "Failed to reset password"
            return $false
        }
    }
    catch {
        Write-Host "Error resetting password"
        return $false
    }
}

# Main execution
if (-not $UserPoolId -or -not $ClientId) {
    Write-Host "Error: UserPoolId and ClientId are required parameters"
    Write-Host "Please provide them or set them as environment variables"
    Write-Host ""
    Show-Help
    exit 1
}

Write-Host "Using User Pool ID: $UserPoolId"
Write-Host "Using Client ID: $ClientId"

switch ($Action.ToLower()) {
    "create-user" {
        if (-not $Username -or -not $Email -or -not $FirstName -or -not $LastName -or -not $Role) {
            Write-Host "Error: Username, Email, FirstName, LastName, and Role are required for create-user"
            exit 1
        }
        Create-User -Username $Username -Email $Email -FirstName $FirstName -LastName $LastName -Role $Role -Department $Department -StudentId $StudentId -InstructorId $InstructorId
    }
    "create-student" {
        if (-not $Username -or -not $Email -or -not $FirstName -or -not $LastName -or -not $Department -or -not $StudentId) {
            Write-Host "Error: Username, Email, FirstName, LastName, Department, and StudentId are required for create-student"
            exit 1
        }
        Create-Student -Username $Username -Email $Email -FirstName $FirstName -LastName $LastName -Department $Department -StudentId $StudentId
    }
    "create-instructor" {
        if (-not $Username -or -not $Email -or -not $FirstName -or -not $LastName -or -not $Department -or -not $InstructorId) {
            Write-Host "Error: Username, Email, FirstName, LastName, Department, and InstructorId are required for create-instructor"
            exit 1
        }
        Create-Instructor -Username $Username -Email $Email -FirstName $FirstName -LastName $LastName -Department $Department -InstructorId $InstructorId
    }
    "add-to-group" {
        if (-not $Username -or -not $GroupName) {
            Write-Host "Error: Username and GroupName are required for add-to-group"
            exit 1
        }
        Add-UserToGroup -Username $Username -GroupName $GroupName
    }
    "remove-from-group" {
        if (-not $Username -or -not $GroupName) {
            Write-Host "Error: Username and GroupName are required for remove-from-group"
            exit 1
        }
        Remove-UserFromGroup -Username $Username -GroupName $GroupName
    }
    "list-users" {
        List-Users
    }
    "list-groups" {
        List-Groups
    }
    "list-users-in-group" {
        if (-not $GroupName) {
            Write-Host "Error: GroupName is required for list-users-in-group"
            exit 1
        }
        List-UsersInGroup -GroupName $GroupName
    }
    "delete-user" {
        if (-not $Username) {
            Write-Host "Error: Username is required for delete-user"
            exit 1
        }
        Delete-User -Username $Username
    }
    "enable-user" {
        if (-not $Username) {
            Write-Host "Error: Username is required for enable-user"
            exit 1
        }
        Enable-User -Username $Username
    }
    "disable-user" {
        if (-not $Username) {
            Write-Host "Error: Username is required for disable-user"
            exit 1
        }
        Disable-User -Username $Username
    }
    "reset-password" {
        if (-not $Username) {
            Write-Host "Error: Username is required for reset-password"
            exit 1
        }
        Reset-UserPassword -Username $Username
    }
    "help" {
        Show-Help
    }
    default {
        Write-Host "Unknown action: $Action"
        Show-Help
        exit 1
    }
}
