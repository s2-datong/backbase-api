const channel_rules = [
    {
        name: "Invite Users",
        rules: [
            `
            if current_plan == "free" and users == 2
            then set allowed = false
            also set message = "Sorry you can't add more users under the free plan. Please upgrade your subscription"
            else set allowed = true
            `
        ]
    },
    {
        name: "Create Workspace Channel",
        rules: [
            `
            if current_plan == "free" and workspace == 1
            then set allowed = false
            also set message = "You can only have one workspace on the free plan"
            else set allowed = true
            `,
            `
            if current_plan == "startup" and workspace == 5
            then set allowed = false
            also set message = "You can only have a maximum of 5 workspaces on the Startup Plan"
            else set allowed = true
            `,
            `
            if current_plan == "standard" and workspace == 20
            then set allowed = false
            also set message = "You can only have a maximum of 20 workspaces on the Standard Plan"
            else set allowed = true
            `,
            `
            if current_plan == "enterprise"
            then set allowed = true
            `
        ]
    },
    {
        name: "Create Channel",
        rules: [
            `
            if current_plan == "free" and channels == 2
            then set allowed = false
            also set message = "You can only have 2 Channels max on the free plan"
            else set allowed = true
            `,
            `
            if current_plan == "startup" and channels == 10
            then set allowed = false
            also set message = "You can only have 10 Channels max on the Startup Plan"
            else set allowed = true
            `,
            `
            if current_plan == "standard" and channels == 50
            then set allowed = false
            also set message = "You can only have 50 Channels max on the Standard Plan"
            else set allowed = true
            `,
            `if current_plan == "enterprise"
            then set allowed = true`
        ]
    },
    {
        name: "Create Rule",
        rules: [
            `if current_plan == "free" and rules == 10
            then set allowed = false
            also set message = "You can only have 10 Rules max on the free plan"
            else set allowed = true`,

            `if current_plan == "startup" and rules == 100
            then set allowed = false
            also set message = "You can only have 100 Rules max on the Startup Plan"
            else set allowed = true`,

            `if current_plan == "standard" and rules == 600
            then set allowed = false
            also set message = "You can only have 600 Rules max on the Standard Plan"
            else set allowed = true`,

            `if current_plan == "enterprise"
            then set allowed = true`
        ]
    },
    {
        name: "Create Polling Job",
        rules: [
            `if current_plan == "free"
            then set allowed = false
            also set message = "Sorry you cannot create polling jobs on the free plan"`,

            `if current_plan == "startup" and polling_jobs == 5
            then set allowed = false
            also set message = "You can only have 5 Polling Jobs max on the Startup Plan"
            else set allowed = true`,

            `if current_plan == "standard" and polling_jobs == 20
            then set allowed = false
            also set message = "You can only have 20 Polling Jobs max on the Standard Plan"
            else set allowed = true`,

            `if current_plan == "enterprise"
            then set allowed = true`
        ]
    },
    {
        name: "Create Functions",
        rules: [
            `if current_plan == "free"
            then set allowed = false
            also set message = "Sorry you cannot create functions on the free plan"`,

            `if current_plan == "startup"
            then set allowed = false
            also set message = "Sorry you cannot create functions on the startup plan"`,

            `if current_plan == "standard" and functions == 20
            then set allowed = false
            also set message = "You can only have 20 Functions max on the Standard Plan"
            else set allowed = true`,

            `if current_plan == "enterprise"
            then set allowed = true`
        ]
    },
    {
        name: "Create Variables",
        rules: [
            `if current_plan == "free"
            then set allowed = false
            also set message = "Sorry you cannot create variables on the free plan"`,

            `if current_plan == "startup" and variables == 5
            then set allowed = false
            also set message = "Sorry you cannot create variables on the free plan"`,

            `if current_plan == "standard" and variables == 60
            then set allowed = false
            also set message = "You can only have 60 Variables max on the Standard Plan"
            else set allowed = true`,

            `if current_plan == "enterprise"
            then set allowed = true`
        ]
    },
    {
        name: "Downgrade from Enterprise",
        rules: [
            `if current_plan == "enterprise" and (
            (downgrade_plan == "standard" and workspace > 20)
            or (downgrade_plan == "startup" and workspace > 5) )
            then set allowed = false
            also set message = "Your total workspace is above the limits allowed by the plan you want to downgrade to"
            `,

            `if current_plan == "enterprise" and (
            (downgrade_plan == "standard" and channels > 50)
            or (downgrade_plan == "startup" and channels > 10) )
            then set allowed = false
            also set message = "The total channels in your workspaces is above the limits allowed by the plan you want to downgrade to"
            `,

            `if current_plan == "enterprise" and (
            (downgrade_plan == "standard" and rules > 600)
            or (downgrade_plan == "startup" and rules > 100) )
            then set allowed = false
            also set message = "The total rules in your workspaces is above the limits allowed by the plan you want to downgrade to"
            `,

            `if current_plan == "enterprise" and (
            (downgrade_plan == "standard" and polling_jobs > 20)
            or (downgrade_plan == "startup" and polling_jobs > 5) )
            then set allowed = false
            also set message = "The total Polling Jobs in your workspaces is above the limits allowed by the plan you want to downgrade to"
            `,

            `if current_plan == "enterprise" and (
            (downgrade_plan == "standard" and functions > 20)
            or (downgrade_plan == "startup" and functions > 0) )
            then set allowed = false
            also set message = "The total functions in your workspaces is above the limits allowed by the plan you want to downgrade to"
            `,

            `if current_plan == "enterprise" and (
            (downgrade_plan == "standard" and variables > 60)
            or (downgrade_plan == "startup" and variables > 5) )
            then set allowed = false
            also set message = "The total variables in your workspaces is above the limits allowed by the plan you want to downgrade to"
            `
        ]
    },
    {
        name: "Downgrade from Standard",
        rules: [
            `if  workspace > 5
            then set allowed = false
            also set message = "Your total workspace is above the limits allowed by the plan you want to downgrade to"
            `,

            `if  channels > 10
            then set allowed = false
            also set message = "The total channels in your workspaces is above the limits allowed by the plan you want to downgrade to"
            `,

            `if rules > 100
            then set allowed = false
            also set message = "The total rules in your workspaces is above the limits allowed by the plan you want to downgrade to"
            `,

            `if polling_jobs > 5
            then set allowed = false
            also set message = "The total Polling Jobs in your workspaces is above the limits allowed by the plan you want to downgrade to"
            `,

            `if functions > 0
            then set allowed = false
            also set message = "The total functions in your workspaces is above the limits allowed by the plan you want to downgrade to"
            `,

            `if variables > 5
            then set allowed = false
            also set message = "The total variables in your workspaces is above the limits allowed by the plan you want to downgrade to"
            `
        ]
    },
    {
        name: "Downgrade from Startup",
        rules: [
            `if  workspace > 1
            then set allowed = false
            also set message = "Your total workspace is above the limits allowed by the plan you want to downgrade to"
            `,

            `if  channels > 2
            then set allowed = false
            also set message = "The total channels in your workspaces is above the limits allowed by the plan you want to downgrade to"
            `,

            `if rules > 10
            then set allowed = false
            also set message = "The total rules in your workspaces is above the limits allowed by the plan you want to downgrade to"
            `,

            `if polling_jobs > 0
            then set allowed = false
            also set message = "The total Polling Jobs in your workspaces is above the limits allowed by the plan you want to downgrade to"
            `,

            `if functions > 0
            then set allowed = false
            also set message = "The total functions in your workspaces is above the limits allowed by the plan you want to downgrade to"
            `,

            `if variables > 0
            then set allowed = false
            also set message = "The total variables in your workspaces is above the limits(0) allowed by the plan you want to downgrade to"
            `
        ]
    }

];

module.exports = channel_rules;